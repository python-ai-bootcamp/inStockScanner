import { appendFile } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function sendNotification({ logger, recipients, subject, textContent }) {
    logger('logfile.mjs::sendNotification - Entered');
    try {
        const logMessage = `
--------------------------------------------------
${new Date().toISOString()}
Subject: ${subject}
Content: ${textContent}
--------------------------------------------------
`;
        const writePromises = recipients.map(recipient => {
            let finalPath = recipient.filename;

            if (os.platform() === 'win32') {
                // On Windows, handle different path formats
                if (finalPath.startsWith('/')) {
                    const match = finalPath.match(/^\/([a-zA-Z])(\/.*)/);
                    if (match) {
                        // Convert '/c/path/to/file' to 'C:\path\to\file'
                        finalPath = path.resolve(`${match[1]}:${match[2]}`);
                    } else {
                        // Handle other absolute paths like '/foo' -> 'C:\foo'
                        finalPath = path.resolve(finalPath);
                    }
                } else if (!path.isAbsolute(finalPath)) {
                    // Handle relative paths
                    finalPath = path.resolve(finalPath);
                }
            } else {
                // On non-Windows (POSIX) systems
                if (!path.isAbsolute(finalPath)) {
                    finalPath = path.resolve(finalPath);
                }
            }

            logger(`Writing notification to ${finalPath}`);
            return appendFile(finalPath, logMessage);
        });

        await Promise.all(writePromises);
        logger('All notifications written successfully.');

    } catch (error) {
        logger('logfile.mjs::sendNotification - ERROR');
        logger(error);
    }
}

export async function initialize({key}) {
    // logfile provider does not need any initialization step
    return;
}

export async function disconnect() {
    // logfile provider does not need any disconnect step
    return;
}
