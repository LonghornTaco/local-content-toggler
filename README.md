# Local Content Toggler

Chrome extension that toggles Sitecore Pages to use content from a local CM instance. Instead of manually adding `Sitecore.Pages.LocalXmCloudUrl` to localStorage via DevTools, just click the toolbar icon.

## Features

- One-click toggle to enable/disable local CM content
- Configurable CM URL (defaults to `https://local.cm.mcc.mayo.edu/`)
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
3. (Optional) Update the Local CM URL and click **Save URL**
4. Flip the toggle — the page reloads with local content enabled

To disable, click the icon again and flip the toggle off.
