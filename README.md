# Local Content Toggler

Chrome extension that toggles Sitecore Pages to use a local XM Cloud CM and rendering host. Instead of manually managing `Sitecore.Pages.LocalXmCloudUrl` and `Sitecore.Pages.LocalRenderingHostUrl` in localStorage via DevTools, just click the toolbar icon.

## Features

- One-click toggle to enable/disable both local CM content and local rendering host
- Configurable URLs for CM and rendering host (saved across sessions)
- Auto-reloads the page after toggling
- Toolbar badge shows ON/OFF state
- Only activates on `pages.sitecorecloud.io`

## Install

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this directory

## Usage

1. Navigate to `pages.sitecorecloud.io`
2. Click the extension icon in the toolbar
3. Enter your local CM URL (e.g. `https://local.cm.example.com/`) and rendering host URL (e.g. `https://local.example.com`)
4. Click **Save URLs**
5. Flip the toggle — the page reloads with local overrides enabled

To disable, click the icon again and flip the toggle off.
