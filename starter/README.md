# Portfolio starter

A blank portfolio site to start from. Every image is a colored box that says what belongs there, and every paragraph says what to write. Replace them with your own work.

For the thinking behind it, read the guide on the example site, and look at the example itself (`../portfolio`) to see a finished version.

## Start

1. Copy everything in this folder to the top level of your own GitHub repository, including `.pages.yml`.
2. Open `content/settings.json` and change your name, headline, links and colors.
3. Rename the project files in `content/projects/` and list them, in order, under `works` in settings.json.
4. Put your images in `images/projects/`, one folder per project, and fill in each project file. Delete a project's `color` once all its images are in.
5. Replace the PDFs in `files/`. Open `print.html` and `resume.html`, print each to PDF, and save them with the names set in settings.json.

## Ways to edit

- **Pages CMS.** Sign in at app.pagescms.org with GitHub and open your repository. `.pages.yml` turns the content files into forms.
- **An AI assistant.** Describe the change, then check it in the browser.
- **By hand**, in any text editor or on github.com.

## Preview and publish

Preview with a small local server, then visit `http://localhost:8000`.

```
python3 -m http.server 8000
```

Publish with GitHub Pages (Settings, then Pages, deploy from the `main` branch).
