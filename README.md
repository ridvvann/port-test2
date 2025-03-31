# Amein Mouse Portfolio

A professional portfolio website for Amein Mouse, a videographer and YouTuber.

## Features

- Responsive design for all devices
- Dark/light mode support
- Portfolio showcase with filtering by category
- YouTube video integration
- Google Drive video and image hosting
- Admin dashboard for content management
- WhatsApp integration for contact and pricing inquiries

## Google Drive Setup

This website uses Google Drive to store and serve media files:

1. **Thumbnails Folder**: https://drive.google.com/drive/folders/1bsyKTxlk-IZxCZeuPeJSJ8hwQBQNHIuQ
2. **Videos Folder**: https://drive.google.com/drive/folders/1CgmNzIphGygCJcCJqVWzQ_HaZUQ7mfjv

### How to Use Google Drive for Media

1. Upload your thumbnail images to the Thumbnails folder
2. Upload your videos to the Videos folder
3. Right-click on the file in Google Drive and select "Get link"
4. Make sure the link is set to "Anyone with the link can view"
5. Copy the link and paste it in the appropriate field in the admin dashboard

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This website can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

## License

This project is licensed under the MIT License.

## Netlify Deployment Guide

This guide will help you deploy your videographer portfolio website to Netlify's free hosting plan.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com))
2. Git installed on your computer
3. A GitHub, GitLab, or Bitbucket account

## Deployment Steps

### 1. Prepare Your Repository

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Make sure your repository includes the `netlify.toml` file

### 2. Connect to Netlify

1. Log in to your Netlify account
2. Click "New site from Git"
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select your portfolio repository

### 3. Configure Build Settings

Netlify should automatically detect the build settings from your `netlify.toml` file, but verify:

- Build command: `npm run build`
- Publish directory: `.next`

### 4. Deploy Your Site

1. Click "Deploy site"
2. Wait for the build and deployment to complete
3. Once deployed, Netlify will provide you with a URL (e.g., `your-site-name.netlify.app`)

### 5. Set Up Environment Variables

1. Go to Site settings > Build & deploy > Environment
2. Add the following environment variable:
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: Your Netlify site URL (e.g., `https://your-site-name.netlify.app`)

### 6. Set Up Forms for File Uploads

For file uploads to work with Netlify:

1. Go to Site settings > Forms
2. Make sure form detection is enabled
3. Note: Netlify's free plan has limitations on file uploads (10MB per file, 100MB per month)

### 7. Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to set up your custom domain

## File Structure for Media

**Important:** Media files (videos and thumbnails) are now stored and served from Google Drive to optimize performance and reduce Netlify's bandwidth usage. The following information is for reference only and might not be actively used.

When using Netlify for hosting media files:

- Thumbnails are stored in: `/public/uploads/thumbnails/`
- Videos are stored in: `/public/uploads/videos/`

## Important Notes

1. **Google Drive Storage**: All videos and thumbnails are now stored on Google Drive. Ensure you have configured the necessary environment variables (e.g., `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_DRIVE_API_KEY`) to access your Google Drive folder.

2. **File Size Limits**: Netlify's free plan has a 100MB limit per deploy, so large video files should be hosted elsewhere (like YouTube) or kept small. This is less relevant now that Google Drive is used for media storage.

3. **Build Minutes**: The free plan includes 300 build minutes per month.

4. **Form Submissions**: Limited to 100 submissions per month on the free plan.

5. **Functions**: Limited to 125,000 function invocations per month.

6. **Bandwidth**: Limited to 100GB per month.

## Troubleshooting

If you encounter issues with your deployment:

1. Check the deploy logs in Netlify
2. Verify your environment variables are set correctly, especially those related to Google Drive.
3. Make sure your forms are properly configured for file uploads
4. Consider using YouTube for larger video files to stay within Netlify's free plan limits (though Google Drive is now the primary solution).
5. Ensure your Google Drive API key and folder ID are valid and have the correct permissions.

## Need Help?

If you need further assistance, contact Netlify support or refer to their documentation at [docs.netlify.com](https://docs.netlify.com).

