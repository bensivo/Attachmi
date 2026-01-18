# Attachmi
Attachmi is a desktop app for structured document storage, designed for the modern knowledge worker.


## Development
Install dependencies:
```bash
cd angular && npm i
cd electron && npm i
```

Running the app:
```bash
npm run start # Builds the angular app and runs electron after
```

Packaging:
```bash
cd electron && npm run build:mac
```
- Note: only tested on mac for now
- Outputs application in the folder `electron/dist` folder

```
Tech Stack:
- Node.js 24 (backend)
- Electron
- Angular
- Sqlite
