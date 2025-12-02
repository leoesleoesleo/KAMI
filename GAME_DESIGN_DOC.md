# KAMI: Simulador Divino - Documentación de Funcionalidades v1.0

Este documento detalla todas las mecánicas, sistemas y características implementadas actualmente en el proyecto **KAMI**.

---

## 1. Visión General
KAMI es un simulador de "Dios" (God-game) con una estética híbrida que combina una interfaz de usuario moderna (Glassmorphism/Futurista) con un lienzo de juego estilo **RPG Táctico / Pixel Art**. El jugador gestiona recursos, crea vida (Bio-Bots) y moldea el entorno para maximizar la producción de energía y puntuación.

---

## 2. Mecánicas del Jugador (Deidad)

### 2.1. Gestión de Recursos
*   **Maná:** Moneda principal para ejecutar acciones divinas.
    *   **Inicio:** 50 Puntos.
    *   **Costo de Acciones:** 10 Puntos por acción.
    *   **Sistema de Ofrendas (Tienda):** El jugador puede ingresar códigos secretos para recargar Maná.
        *   *Código Actual:* `1866` (+100 Maná).
*   **Estadísticas Globales:**
    *   **Puntuación de Producción:** Suma total de la productividad de todos los Bio-Bots.
    *   **Energía Vital Promedio:** Promedio de salud/energía de la población actual.

### 2.2. Acciones Divinas
1.  **Crear Especie (Bio-Bot):** Genera una entidad viva en el mapa.
2.  **Crear Tierra Fértil:** Modo de colocación manual (Crosshair) para instanciar parcelas de cultivo.
3.  **Regar Cultivos (Lluvia):** Aumenta el nivel de recursos de todas las tierras existentes y genera un efecto visual y sonoro de riego.
4.  **Orden de Trabajo:** Ordena a todos los Bio-Bots vivos buscar tierras fértiles y trabajar en ellas durante 3 minutos.

---

## 3. Entidades: Bio-Bots

### 3.1. Características Biológicas
*   **Géneros y Estética:**
    *   **Macho (Alpha):** Paleta de colores Ocre/Dorado oscuro, formas industriales.
    *   **Hembra (Beta):** Paleta de colores Amarillo Pastel/Crema, formas suaves.
    *   **Base Visual:** Estilo "Bottts" (Robots) forzados a una paleta amarilla estricta.
*   **Atributos:** Nombre único, Edad, Fuerza, Inteligencia, Personalidad (Lógico, Curioso, Protector, etc.).

### 3.2. Ciclo de Vida y Energía
*   **Energía Vital (0-100%):**
    *   Se consume pasivamente al estar ocioso o caminar.
    *   Se consume más rápido al trabajar.
    *   Se recarga al alimentarse de tierras fértiles activas.
*   **Indicadores Visuales de Energía:**
    *   **100% - 80%:** Color Amarillo (Óptimo).
    *   **79% - 50%:** Color Naranja (Cansado).
    *   **49% - 0%:** Color Rosa/Magenta (Crítico).
*   **Muerte:**
    *   **Causa Automática:** Permanecer 10 minutos con 0% de energía.
    *   **Causa Manual:** Botón "Matar" en el inspector.
    *   **Estado "Muriendo":** El bot se congela, se torna gris/azulado, muestra el badge "Muriendo" y desaparece gradualmente tras 5 minutos.

### 3.3. Comportamiento (IA)
*   **Estados:** Ocioso, Caminando, Trabajando, Alimentándose, Socializando, Muerto.
*   **Sistema de Empatía:** Los bots muestran aleatoriamente emojis sobre sus cabezas (guiños, corazones, dudas) y tienen una animación de "respiración".
*   **Chat Interactivo:** Sistema de chat simulado donde el bot responde según su personalidad y estado actual.
*   **Movimiento Manual:** El jugador puede arrastrar y soltar a los Bio-Bots por el mapa.

---

## 4. Entorno y Cultivos

### 4.1. Tierras Fértiles
*   **Ciclo de Crecimiento:**
    *   **Fase 0 (Amarillo):** Tierra yerma/sembrada. 0% Recursos. (Poca puntuación).
    *   **Fase 1 (Rosa):** En crecimiento. 50% Recursos. (Puntuación media).
    *   **Fase 2 (Verde):** Cosecha lista. 100% Recursos. (Máxima puntuación).
*   **Mecánicas:**
    *   **Riego:** Necesario para avanzar de fase.
    *   **Decaimiento:** Si una tierra permanece en Fase 0 (Amarillo) por más de 2 minutos, desaparece del mapa.
    *   **Interacción:** Los bots consumen los recursos de la tierra para recargar energía.

### 4.2. Lienzo (World Canvas)
*   **Estética:** RPG Táctico / Pixel Art. Fondo verde vibrante con patrón de damero (cuadrícula) y bordes de mapa.
*   **Controles:** Zoom (Rueda del mouse o botones UI), Paneo (Click izquierdo + arrastrar fondo).
*   **Efectos:**
    *   **Riego:** Animación de regadera naranja 3D con partículas de agua y salpicaduras.
    *   **Viñeta:** Oscurecimiento en bordes para focalizar la atención.

---

## 5. Sistema Técnico: KAMI-LOG

### 5.1. Registro de Eventos
Sistema avanzado de logs que captura toda la actividad del ecosistema.
*   **Memoria de Corto Plazo:** Últimos 100-300 eventos detallados.
*   **Memoria de Largo Plazo:** Resúmenes compactados de bloques de eventos antiguos.
*   **Tipos de Eventos:** Creación, Muerte, Cambios de Estado, Economía, Alertas del Sistema.

### 5.2. Live Console
*   Consola interactiva en la parte inferior de la pantalla.
*   Muestra eventos en tiempo real con colores por severidad (INFO, WARNING, CRITICAL).
*   Permite expandir cada línea para ver el JSON crudo del evento.

### 5.3. Runtime Tests
*   Al iniciar el juego, se ejecuta una batería de pruebas automáticas (sin bloquear la UI) para validar la física, matemáticas de puntuación y lógica de muerte.

---

## 6. Configuración y Extensibilidad
El juego se rige por el archivo `gameConfig.ts`, permitiendo ajustar sin tocar código:
*   Tasas de decaimiento de energía.
*   Tiempos de muerte y congelación.
*   Umbrales de puntuación.
*   Duración del trabajo (actualmente 3 minutos).
*   Colores y límites del mundo.
