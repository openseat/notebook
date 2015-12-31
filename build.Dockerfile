FROM node
COPY ./package.json /opt/openseat-notebook/
WORKDIR /opt/openseat-notebook
RUN npm install \
  && npm list
CMD npm run live
