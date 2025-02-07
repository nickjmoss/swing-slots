#!/bin/bash

# Define the container name
CONTAINER_NAME="swing-slots_prod"
IMAGE_NAME="swing-slots-prod:latest"

# Check if the container exists
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    # If the container exists, stop and remove it
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Create and run a new container with the same name
docker build -t $IMAGE_NAME .
docker run -d -e NODE_ENV=production -e PORT=4000 --name $CONTAINER_NAME -p 6060:4000 $IMAGE_NAME

docker logs -f $CONTAINER_NAME