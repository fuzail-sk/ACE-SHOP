import path from 'node:path';
import process from 'node:process';
import { authenticate } from '@google-cloud/local-auth';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send'
];

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  'credentials.json'
);

async function authorizeGmail() {
  try {
    console.log('Starting Gmail authorization...');

    const auth = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH
    });

    console.log('');
    console.log('Gmail authorization successful.');
    console.log('');

    if (auth.credentials.refresh_token) {
      console.log(
        'Refresh token was received successfully.'
      );

      console.log('');
      console.log(
        'Keep this token PRIVATE. Do not commit it to GitHub.'
      );
    } else {
      console.log(
        'No refresh token was returned.'
      );

      console.log(
        'Google may already have an authorization for this app.'
      );
    }

    console.log('');
    console.log(
      'Authorized account:',
      auth.credentials
        ? 'Authorization completed'
        : 'Unknown'
    );

    console.log('');

    if (auth.credentials.refresh_token) {
      console.log(
        'REFRESH_TOKEN_START'
      );

      console.log(
        auth.credentials.refresh_token
      );

      console.log(
        'REFRESH_TOKEN_END'
      );
    }

    console.log('');
    console.log('Done.');
  } catch (error) {
    console.error(
      'Gmail authorization failed:'
    );

    console.error(error.message);

    process.exit(1);
  }
}

authorizeGmail();