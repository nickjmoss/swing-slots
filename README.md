# Swing Slots

## Getting Started

1. Replace all instances of `vue-node-docker-template` with the name of your app.
2. Run `yarn packages` at the root of the project.
3. Run `docker compose-up --no-log-prefix` to start the app.

## Running the app outside of Docker

If you want to run the app outside of Docker, you should run the frontend and server start scripts in separate terminal windows. The reason for this is because the root `yarn start` script runs both the frontend dev server and the API server inside of the same terminal. This causes issues outside of Docker because when you hit `CTRL + C` to kill the server, it does not kill the API server correctly and leaves the process running on the port. Running each server in a dedicated terminal window will prevent this from happening so you can kill the API server without any problems.

In a separate terminal window run:

1. `cd frontend && yarn start`

And in antoher terminal window run:

1. `cd server && yarn start`
