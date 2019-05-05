FROM node:11
LABEL name="node-chrome"

# Install Chrome

RUN echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' > /etc/apt/sources.list.d/chrome.list

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -

RUN set -x \
    && apt-get update \
    && apt-get install -y \
    google-chrome-stable

ENV CHROME_BIN /usr/bin/google-chrome

WORKDIR /usr/grca-bot

COPY package*.json ./
RUN npm install

COPY src ./src/

CMD [ "node", "./src/index.js" ]
