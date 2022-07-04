# Broadcasting System - Desktop Edition

This repository offers an Electron app running a React webpage that allows users to host local relays, manage organizations, manage teams in an organization, etc. The main reason for this application is to have an all-in-one hub where we can host local relays for zero latency game data streaming to the overlays so that they are in sync.

## Developing

To run the Electron app, execute the following:
```
npm run dev
```

## Tasks

- [X] Create the initial application with React, Electron and Sass
- [ ] Create a relay fork to allow code to be used locally
- [ ] Create local views for modifying organizations, teams, tournaments, etc
- [ ] Add local notifications for when a user receives a notification (invites to an organization, server being online for > 24hrs, etc)
- [ ] Add a "Quick Connect" button to automatically connect any overlays and plugins to the local relay