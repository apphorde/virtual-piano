FROM nginx:alpine

# Copy static website to nginx's default html directory
COPY --chown=nginx:nginx . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx (default CMD already does this)