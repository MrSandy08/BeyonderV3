# Imagen base con Python y Node.js
FROM nikolaik/python-nodejs:python3.12-nodejs20-slim

# Instalamos las librerías de sistema necesarias (Modernas para Debian/Ubuntu)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    git \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json requirements.txt ./

# Instalamos dependencias de Python y Node.js
RUN pip install --no-cache-dir -r requirements.txt
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa Hugging Face (7860)
EXPOSE 7860

# El comando start ahora usa concurrently para lanzar ambos servicios
CMD ["npm", "start"]