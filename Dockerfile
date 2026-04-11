# Imagen base ligera con Python y Node.js optimizada para HF Spaces
FROM nikolaik/python-nodejs:python3.12-nodejs20-slim

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instalamos dependencias de sistema necesarias para node-canvas, sharp y ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    git \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Crear directorios necesarios con permisos para el usuario de HF (UID 1000)
RUN mkdir -p /app/logs /app/auth && chown -R 1000:1000 /app

# Cambiar al usuario no-root por seguridad en HF
USER 1000

# Copiamos archivos de dependencias
COPY --chown=1000:1000 package.json requirements.txt ./

# Instalamos dependencias de Node.js primero
RUN npm install --production

# Instalamos dependencias de Python (si se requieren para el detector)
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código
COPY --chown=1000:1000 . .

# El puerto 7860 es obligatorio para que HF Spaces muestre el Dashboard
EXPOSE 7860

# Comando de arranque (usamos el script start que lanza index.js)
CMD ["npm", "start"]