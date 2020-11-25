
echo "Building CubeVis Frontend locally.."
sleep 2

echo "Pulling repository.."
git pull

echo "Installing dependencies.."
npm ci

echo "Building docker container.."
echo "This will take some time and memory!"
docker build -t cubevis:latest ../

echo "Running docker container.."
docker run -p 3001:80 -d cubevis:latest

echo "Application was successfully built, started & can be accessed via http://localhost:3001"
sleep 5