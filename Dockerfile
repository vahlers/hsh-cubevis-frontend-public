### build project in seperate stage
FROM node:lts-alpine as build-stage

# set working directory
WORKDIR /app

# copy project in working directory
COPY . /app

# install locked dependencies from package-lock.json
RUN npm ci

# build project
RUN npm run build

# remove file with sensitive key material
RUN rm -f .npmrc

### production stage with built files only
FROM nginx:1-alpine as production-stage

# copy built files from building stage
COPY --from=build-stage /app/build /usr/share/nginx/html

#RUN apk add --no-cache bash

# copy nginx conf in container
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# expose port 80
EXPOSE 80