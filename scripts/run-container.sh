echo "Running container from GitHub Package Registry.."
docker run -p 3001:80 -d docker.pkg.github.com/manuelottlik/hsh-cubevis-frontend/hsh-cubevis-frontend:latest