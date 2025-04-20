# GTM Chatbot Setup Guide

## Overview

The GTM Assistant is an AI-powered chatbot that allows users to interact with their Go-to-Market (GTM) documents stored in Google Drive. The assistant provides answers and insights based on the content of connected documents.

## Setup Requirements

### 1. Google Cloud Project and Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it
4. Create a service account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Enter a name and description
   - Grant the service account the "Editor" role for the project
   - Click "Create and Continue"
5. Create a key for the service account:
   - Click on the newly created service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select JSON format and create
   - The key file will be downloaded to your computer

### 2. Share Your Google Drive Folder

1. Create or identify the Google Drive folder containing your GTM documents
2. Right-click on the folder and select "Share"
3. Add the service account email (it looks like: `your-service-account@your-project.iam.gserviceaccount.com`)
4. Grant "Viewer" access to the service account
5. Copy the folder ID from the URL (the long string after "folders/" in the URL)

### 3. Configure Environment Variables

Add the following variables to your backend `.env` file:

```
# Google Drive Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
```

Note: When copying the private key from the JSON file, replace newline characters with "\n".

## Usage

### Connecting to Google Drive

Once the setup is complete, the chatbot will automatically connect to your Google Drive folder and index the documents. The documents will be used as context when answering user queries.

### Interacting with the Chatbot

The chatbot appears as a small chat icon in the bottom right corner of the application. Users can:

1. Click the icon to open the chat window
2. Type questions related to GTM strategy, documents, or general inquiries
3. Expand the chat to full screen for a better viewing experience
4. Close the chat when done

### Document Types Supported

The chatbot can process the following document types from Google Drive:

- Text files (.txt)
- PDF documents (.pdf)
- Google Docs
- Google Sheets
- Google Slides
- Microsoft Office documents (.docx, .xlsx, .pptx)
- JSON files (.json)

## Troubleshooting

### Common Issues

1. **Chatbot can't access documents**:
   - Verify the service account has been granted access to the folder
   - Check that the GOOGLE_DRIVE_FOLDER_ID is correct

2. **Authentication errors**:
   - Ensure the GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are correctly formatted
   - Make sure the Google Drive API is enabled in your Google Cloud project

3. **No response from chatbot**:
   - Verify your OpenAI API key is valid
   - Check server logs for any errors related to the chatbot service

### Support

For additional help, contact support at support@thegtmapp.com.