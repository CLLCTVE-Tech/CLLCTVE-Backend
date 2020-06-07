FROM library/node:11.15.0

RUN mkdir -p /usr/src/app
# Everything under WORKDIR will assume your container destination is this directory
WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci && \
  rm -rf /root/.npm

EXPOSE 3001
EXPOSE 27017

COPY ./ ./

# RUN npm run test:ci
#RUN npm run build

CMD ["npm", "start"]
