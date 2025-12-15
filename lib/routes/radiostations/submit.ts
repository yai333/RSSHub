import type { Route } from '@/types';
import { addSubmissionToGitHub } from './submissions';

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
    path: '/submit',
    categories: ['other'],
    example: '/radiostations/submit?name=MyRadio&streamURL=https://stream.example.com/live&country=Hong%20Kong&genre=Music',
    features: {
        antiCrawler: false,
        supportRadar: false,
    },
    radar: [],
    name: 'Submit Station',
    maintainers: ['yai333'],
    description: 'Submit a new radio station to the community directory. Submissions are stored in GitHub.',
    handler,
};

async function handler(ctx) {
    const query = ctx.req.query();

    // Validate required fields
    const name = query.name;
    const streamURL = query.streamURL;
    const country = query.country;
    const genre = query.genre;

    if (!name || !streamURL || !country || !genre) {
        return {
            title: 'Submission Error',
            link: 'https://github.com/yai333/RSSHub',
            description: 'Missing required fields: name, streamURL, country, genre',
            item: [{
                title: 'Error: Missing required fields',
                description: '<p>Please provide all required fields:</p><ul><li>name</li><li>streamURL</li><li>country</li><li>genre</li></ul>',
                link: 'https://github.com/yai333/RSSHub',
                guid: `error-${Date.now()}`,
            }],
        };
    }

    // Validate stream URL format
    try {
        new URL(streamURL);
    } catch {
        return {
            title: 'Submission Error',
            link: 'https://github.com/yai333/RSSHub',
            description: 'Invalid streamURL format',
            item: [{
                title: 'Error: Invalid stream URL',
                description: 'The streamURL must be a valid URL (e.g., https://stream.example.com/live.mp3)',
                link: 'https://github.com/yai333/RSSHub',
                guid: `error-${Date.now()}`,
            }],
        };
    }

    // Create submission
    const submission: StationSubmission = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        name: name.trim(),
        streamURL: streamURL.trim(),
        country: country.trim(),
        genre: genre.trim(),
        websiteURL: query.websiteURL?.trim() || undefined,
        description: query.description?.trim() || undefined,
        submittedAt: new Date().toISOString(),
        status: 'pending',
    };

    // Save to GitHub
    const saved = await addSubmissionToGitHub(submission);

    if (!saved) {
        return {
            title: 'Submission Received (Pending Sync)',
            link: 'https://github.com/yai333/RSSHub',
            description: `Station "${submission.name}" received but could not be saved to GitHub. It has been logged for manual review.`,
            item: [{
                title: `Received: ${submission.name}`,
                description: `
                    <p><strong>Status:</strong> Received (pending sync)</p>
                    <p><strong>ID:</strong> ${submission.id}</p>
                    <p>Your submission was received but could not be automatically saved. It has been logged for manual review.</p>
                `,
                link: submission.websiteURL || submission.streamURL,
                guid: submission.id,
                pubDate: new Date().toUTCString(),
            }],
        };
    }

    return {
        title: 'Station Submitted Successfully',
        link: 'https://github.com/yai333/RSSHub',
        description: `Station "${submission.name}" has been submitted and saved for review`,
        item: [{
            title: `Submitted: ${submission.name}`,
            description: `
                <p><strong>Status:</strong> ${submission.status}</p>
                <p><strong>ID:</strong> ${submission.id}</p>
                <p><strong>Name:</strong> ${submission.name}</p>
                <p><strong>Stream:</strong> <a href="${submission.streamURL}">${submission.streamURL}</a></p>
                <p><strong>Country:</strong> ${submission.country}</p>
                <p><strong>Genre:</strong> ${submission.genre}</p>
                ${submission.websiteURL ? `<p><strong>Website:</strong> <a href="${submission.websiteURL}">${submission.websiteURL}</a></p>` : ''}
                <p>Your station has been saved and will be reviewed before appearing in the community directory.</p>
            `,
            link: submission.websiteURL || submission.streamURL,
            guid: submission.id,
            pubDate: new Date().toUTCString(),
        }],
    };
}
