# Imagen base muy ligera solo con Node.js
FROM node:20-slim

# Instalar git y ca-certificates para certificados SSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json ./

# 1. Obliga a descargar por HTTPS en vez de SSH
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"

# 2. Ahora sí, instalamos dependencias de Node.js
RUN npm install --production

# Copiamos el resto del código
COPY . .

# Puerto para Render
EXPOSE 7860

# Comando de arranque
CMD ["npm", "start"]
