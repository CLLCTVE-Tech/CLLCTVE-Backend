FROM library/node:11.15.0

RUN mkdir -p /usr/src/app
CMD cd /usr/src/app
# Everything under WORKDIR will assume your container destination is this directory
WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# Quiet flag improves install speed, reduces log noise, and still lets you know when something went wrong
RUN npm install --quiet && \
  rm -rf /root/.npm

COPY ./ ./

EXPOSE 3001
EXPOSE 27018

# RUN npm run test:ci
#RUN npm run build

CMD ["npm", "start"]
