
# 🧬 BioBots: Génesis Evolutiva - Documentación Técnica v2.0

> **Estado del Proyecto:** Activo / Fase de Producción  
> **Temática:** Simulación de Vida Artificial / Cyberpunk / God-Game  
> **Versión Actual:** 2.0.0 (Tech-Overhaul)

![Concept Art](https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop)

---

## 1. Visión General del Sistema
**BioBots** es un simulador de ecosistema digital donde el usuario asume el rol de un "Arquitecto de Sistemas". El objetivo es gestionar recursos energéticos (Maná) para instanciar vida artificial, optimizar nodos de datos (cultivos) y observar la evolución de una civilización de bots autónomos en un entorno hostil de "Deep Web".

La estética ha evolucionado de un RPG tradicional a una **Interfaz de Comandos Futurista**, inspirada en *Black Mirror*, *Matrix* y sistemas operativos de ciencia ficción.

---

## 2. Entorno Visual (The Construct)

### 2.1. El Lienzo (World Canvas)
El mundo ya no es un terreno físico, sino una **Grilla de Datos** infinita.
*   **Fondo:** Negro profundo (`#020617`) con una malla digital sutil.
*   **Topografía Digital:** Se implementó un mapa de relieve (curvas de nivel) vectoriales.
*   **Zonas Térmicas:**
    *   🔴 **Sector Cálido (Noreste):** Área de alta actividad de procesamiento.
    *   🔵 **Sector Frío (Suroeste):** Área de baja latencia / enfriamiento.
*   **Mini-mapa:** Radar en tiempo real ubicado en la esquina inferior derecha que rastrea todas las entidades activas.

### 2.2. Interfaz de Usuario (HUD)
La UI sigue los principios de **Glassmorphism Oscuro**:
*   **Barra Lateral (Toolbar):** Ubicada a la izquierda verticalmente. Minimalista, iconos tecnológicos (Bot, Database, Zap, Terminal).
*   **Consola en Vivo:** Terminal estilo hacker en la parte inferior (colapsada por defecto) que narra los eventos del sistema.
*   **Estadísticas Responsivas:** En móviles, los datos vitales se apilan en el encabezado para máxima legibilidad.

---

## 3. Entidades: La Vida Digital

### 3.1. BioBots (Unidades de Procesamiento)
Seres de inteligencia artificial con apariencia robótica amarilla (Paleta estricta "Gold/Amber").

#### **Ciclo de Génesis (Nacimiento)**
El BioBot no aparece de la nada. Sigue una secuencia cinemática de 5 segundos:
1.  **Fase Máquina (0s):** Un proyector holográfico se despliega en el suelo.
2.  **Fase Cápsula (0.5s):** Se materializa un "Huevo de Datos" hexagonal.
3.  **Fase Crítica (3.0s):** El huevo se vuelve inestable, vibra y aparecen grietas de luz roja.
4.  **Eclosión (4.5s):** Una explosión de luz blanca revela a la nueva unidad.

#### **Estados y Ciclo de Vida**
*   **Energía:** Batería interna que se agota con el movimiento y trabajo.
*   **Muerte (Obsolescencia):**
    *   Si la energía llega a 0% y permanece así por 10 minutos.
    *   **Efecto Visual:** El bot se congela, su filtro cambia a escala de grises/azulado y muestra un badge rosado parpadeante: `💀 Muriendo`.
    *   Tras 5 minutos en este estado, es eliminado del sistema (Garbage Collection).

### 3.2. Nodos de Datos (Anteriormente "Tierras")
Representados por iconos de Servidores/Bases de Datos (`HardDrive`).
*   **Amarillo:** Nodo vacío / Sin datos.
*   **Rosa:** Procesando (50% carga).
*   **Verde:** Optimizado (100% carga).

---

## 4. Mecánicas de Interacción

### 4.1. Recarga Energética (Nanotubos)
Se reemplazó la lluvia/regadera por un sistema de **Inyección de Energía Directa**.
*   **Visual:** Un cable de nanotubos baja desde el "cielo" y se conecta al Nodo de Datos.
*   **Animación:** Una corriente eléctrica ionizada recorre el cable.
*   **Impacto:** Al conectar, se genera una onda de choque (Shockwave) y un destello.

### 4.2. Protocolos de Trabajo
*   **Validación Estricta:** El sistema impide enviar órdenes de trabajo si no hay unidades operativas vivas.
*   **Feedback:** Si falla, muestra una notificación tipo Toast: `ERROR: NO UNIDADES OPERATIVAS`.
*   **Lógica:** Los bots vivos buscan Nodos de Datos activos para minar recursos (puntos).

### 4.3. Movimiento y Control
*   **Drag & Drop:** El Arquitecto puede arrastrar cualquier BioBot manualmente para reubicarlo.
*   **Zoom de Precisión:**
    *   Incrementos exactos del **5%**.
    *   Zoom centrado en el punto de mira (evita el desplazamiento lateral).

---

## 5. Arquitectura Técnica (KAMI-CORE)

### 5.1. Sistema de Logs (KAMI-LOG)
Cerebro de registro de eventos.
```json
{
  "shortTermMemory": [
    { "type": "BIOBOT_CREATED", "severity": "INFO", "timestamp": 1710... },
    { "type": "SYSTEM_ALERT", "severity": "CRITICAL", "payload": { "msg": "Low Energy" } }
  ],
  "longTermMemory": [ ...Resúmenes compactados... ]
}
```

### 5.2. Runtime Test Runner
Al iniciar la aplicación, se ejecuta un script invisible en la consola del navegador que valida:
1.  Matemáticas de puntuación.
2.  Lógica de muerte y temporizadores.
3.  Física de decaimiento de energía.
*Si alguna prueba falla, se alerta en la consola de desarrollo.*

### 5.3. Configuración Parametrizable (`gameConfig.ts`)
Control total sobre el balance del juego:
*   `WORK_DURATION_MS`: 180,000 (3 minutos).
*   `DEATH_TIMEOUT`: 10 minutos.
*   `ENERGY_DECAY`: Tasas reducidas para mayor longevidad (0.02 idle / 0.08 work).

---

## 6. Guía de Estilos (Design Token)

| Elemento | Color | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Fondo** | Deep Space | `#020617` | Lienzo principal |
| **Acento 1** | Tech Cyan | `#06b6d4` | Bordes, Energía, Botones |
| **Acento 2** | Neon Green | `#10b981` | Éxito, Vida, Nodos llenos |
| **Alerta** | Alert Red | `#ef4444` | Error, Muerte, Crítico |
| **Panel** | Slate Glass | `rgba(15, 23, 42, 0.85)` | Contenedores UI |

---

*Documentación generada automáticamente por el Sistema KAMI v2.0*
