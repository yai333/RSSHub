import type { Route } from '@/types';
import got from '@/utils/got';
import logger from '@/utils/logger';

const GITHUB_REPO = 'yai333/RSSHub';
const SUBMISSIONS_PATH = 'exports/submissions.json';

interface StationSubmission {
    id: string;
    name: string;
    streamURL: string;
    country: string;
    genre: string;
    websiteURL?: string;
    description?: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
}

export const route: Route = {
    path: '/submissions',
    categories: ['other'],
    example: '/radiostations/submissions',
    features: {
        antiCrawler: false,
        supportRadar: false,
    },
    radar: [],
    name: 'Station Submissions',
    maintainers: ['yai333'],
    description: 'View pending community station submissions',
    handler,
};

async function handler() {
    const submissions = await fetchSubmissions();

    return {
        title: 'Pending Station Submissions',
        link: 'https://github.com/yai333/RSSHub',
        description: `Community-submitted radio stations pending review (${submissions.length} total)`,
        item: submissions.map((submission) => ({
            title: `[${submission.status.toUpperCase()}] ${submission.name}`,
            description: `
                <p><strong>Name:</strong> ${submission.name}</p>
                <p><strong>Stream URL:</strong> <a href="${submission.streamURL}">${submission.streamURL}</a></p>
                <p><strong>Country:</strong> ${submission.country}</p>
                <p><strong>Genre:</strong> ${submission.genre}</p>
                ${submission.websiteURL ? `<p><strong>Website:</strong> <a href="${submission.websiteURL}">${submission.websiteURL}</a></p>` : ''}
                ${submission.description ? `<p><strong>Description:</strong> ${submission.description}</p>` : ''}
                <p><strong>Submitted:</strong> ${submission.submittedAt}</p>
                <p><strong>Status:</strong> ${submission.status}</p>
            `,
            link: submission.websiteURL || submission.streamURL,
            guid: submission.id,
            pubDate: new Date(submission.submittedAt).toUTCString(),
        })),
    };
}

// Fetch submissions from GitHub
export async function fetchSubmissions(): Promise<StationSubmission[]> {
    try {
        const response = await got(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/${SUBMISSIONS_PATH}`, {
            timeout: { request: 10000 },
        });
        return JSON.parse(response.body);
    } catch {
        // File doesn't exist yet or error fetching
        return [];
    }
}

// Add a submission to GitHub (called from submit.ts)
export async function addSubmissionToGitHub(submission: StationSubmission): Promise<boolean> {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        logger.error('GITHUB_TOKEN not set - cannot persist submission');
        return false;
    }

    try {
        // Get current file content and SHA
        let currentSubmissions: StationSubmission[] = [];
        let sha: string | undefined;

        try {
            const fileResponse = await got(`https://api.github.com/repos/${GITHUB_REPO}/contents/${SUBMISSIONS_PATH}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'RSSHub-RadioStations',
                },
            });
            const fileData = JSON.parse(fileResponse.body);
            sha = fileData.sha;
            currentSubmissions = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));
        } catch {
            // File doesn't exist, will create new
        }

        // Add new submission
        currentSubmissions.push(submission);

        // Update file on GitHub
        await got.put(`https://api.github.com/repos/${GITHUB_REPO}/contents/${SUBMISSIONS_PATH}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'RSSHub-RadioStations',
            },
            json: {
                message: `Add station submission: ${submission.name}`,
                content: Buffer.from(JSON.stringify(currentSubmissions, null, 2)).toString('base64'),
                sha,
            },
        });

        logger.info(`Submission saved to GitHub: ${submission.id}`);
        return true;
    } catch (error: unknown) {
        logger.error(`Failed to save submission to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}
