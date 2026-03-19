/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, LogOut, Newspaper, Info } from 'lucide-react';
import { Chatbot } from './components/Chatbot';
import { SpaceNews } from './components/SpaceNews';
import { SiteInfo } from './components/SiteInfo';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Definición de los datos de los planetas
const PLANETS = [
  { 
    id: 'mercury', 
    name: 'Mercurio', 
    color: '#a8a8a8', 
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mercury_in_true_color.jpg/600px-Mercury_in_true_color.jpg',
    size: 24, 
    orbitRadius: 110, 
    speed: 8, 
    desc: 'El planeta más pequeño y cercano al Sol. No tiene atmósfera significativa, lo que provoca temperaturas extremas.', 
    details: { Masa: '3.30 × 10^23 kg', Lunas: '0', Gravedad: '3.7 m/s²' },
    introduction: 'Mercurio es el planeta del sistema solar más cercano al Sol y el más pequeño. Forma parte de los denominados planetas interiores y carece de satélites naturales. Su superficie está fuertemente craterizada, similar a la de la Luna de la Tierra, lo que indica que ha estado geológicamente inactivo durante miles de millones de años.',
    history: 'Conocido desde la antigüedad, su nombre proviene del dios romano Mercurio, el mensajero de los dioses, debido a su rápido movimiento a través del cielo. Las primeras observaciones detalladas fueron realizadas por la sonda Mariner 10 en 1974, y más recientemente por la misión MESSENGER, que cartografió todo el planeta.',
    keyPoints: ['Es el planeta más pequeño del sistema solar, apenas un poco más grande que la Luna de la Tierra.', 'Tiene la órbita más excéntrica y la inclinación axial más pequeña de todos los planetas.', 'Experimenta las mayores variaciones de temperatura, desde -173 °C en la noche hasta 427 °C durante el día.', 'No posee lunas ni anillos.', 'Su núcleo de hierro es inusualmente grande, ocupando aproximadamente el 85% de su radio.'],
    conclusion: 'A pesar de ser el más cercano al Sol, no es el más caliente (ese título pertenece a Venus), pero su proximidad y falta de atmósfera lo convierten en un mundo de extremos fascinantes, ofreciendo pistas vitales sobre la formación del sistema solar interior.',
    summary: 'El planeta más pequeño y cercano al Sol, con una superficie rocosa llena de cráteres, un núcleo de hierro masivo y temperaturas extremas debido a la falta de una atmósfera densa.'
  },
  { 
    id: 'venus', 
    name: 'Venus', 
    color: '#e0c094', 
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Venus_from_Mariner_10.jpg/600px-Venus_from_Mariner_10.jpg',
    size: 40, 
    orbitRadius: 170, 
    speed: 15, 
    desc: 'El segundo planeta, con una atmósfera densa y tóxica que atrapa el calor en un efecto invernadero desbocado.', 
    details: { Masa: '4.87 × 10^24 kg', Lunas: '0', Gravedad: '8.87 m/s²' },
    introduction: 'Venus es el segundo planeta del sistema solar en orden de distancia desde el Sol. Es un planeta terrestre, a veces llamado el planeta hermano de la Tierra por su tamaño, masa y composición similares. Sin embargo, sus condiciones superficiales son radicalmente diferentes, siendo el planeta más caliente del sistema solar.',
    history: 'Nombrado en honor a la diosa romana del amor y la belleza. Ha sido un objeto de fascinación desde la antigüedad por ser el objeto natural más brillante en el cielo nocturno después de la Luna. Fue el primer planeta en ser visitado por una nave espacial (Mariner 2 en 1962) y el primero en el que aterrizó una sonda (Venera 7 en 1970).',
    keyPoints: ['Tiene la atmósfera más densa de los planetas terrestres, compuesta principalmente de dióxido de carbono.', 'Su superficie está oculta por nubes opacas de ácido sulfúrico altamente reflectantes.', 'Es el planeta más caliente del sistema solar debido a un efecto invernadero desbocado, con temperaturas superficiales de hasta 475 °C.', 'Gira en dirección opuesta a la mayoría de los demás planetas (rotación retrógrada).', 'La presión atmosférica en su superficie es 92 veces mayor que la de la Tierra.'],
    conclusion: 'Venus es un mundo infernal que nos advierte sobre los peligros del efecto invernadero extremo. A pesar de sus similitudes iniciales con la Tierra, su evolución tomó un camino drásticamente diferente, convirtiéndolo en un entorno hostil para la vida tal como la conocemos.',
    summary: 'El segundo planeta desde el Sol, extremadamente caliente y cubierto por una densa atmósfera tóxica de dióxido de carbono y nubes de ácido sulfúrico, con una rotación retrógrada única.'
  },
  { 
    id: 'earth', 
    name: 'Tierra', 
    color: '#4b90e2', 
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/600px-The_Earth_seen_from_Apollo_17.jpg',
    size: 44, 
    orbitRadius: 240, 
    speed: 25, 
    desc: 'Nuestro hogar, el único planeta conocido que alberga vida, con vastos océanos de agua líquida.', 
    details: { Masa: '5.97 × 10^24 kg', Lunas: '1', Gravedad: '9.8 m/s²' },
    introduction: 'La Tierra es el tercer planeta desde el Sol y el único objeto astronómico conocido que alberga vida. Es el más denso y el quinto mayor de los ocho planetas del sistema solar. Es un planeta terrestre dinámico, con montañas, valles, cañones, llanuras y una gran cantidad de agua.',
    history: 'Se formó hace aproximadamente 4500 millones de años a partir de la nebulosa solar, y la vida surgió en su superficie mil millones de años después. Su nombre proviene del latín Terra, deidad romana equivalente a Gea. A lo largo de su historia, ha experimentado extinciones masivas y eras glaciales, moldeando la evolución de la biosfera.',
    keyPoints: ['Único planeta conocido con vida, albergando millones de especies.', 'Su superficie está cubierta en un 71% por agua líquida, esencial para todas las formas de vida conocidas.', 'Tiene una atmósfera rica en nitrógeno (78%) y oxígeno (21%), que nos protege de la radiación solar dañina y los meteoritos.', 'Posee un fuerte campo magnético generado por su núcleo externo líquido.', 'Su único satélite natural, la Luna, estabiliza la inclinación del eje terrestre y causa las mareas.'],
    conclusion: 'Nuestro hogar es un oasis frágil y único en la inmensidad del espacio. El delicado equilibrio de su atmósfera, océanos y ecosistemas permite la asombrosa diversidad de vida que conocemos, lo que subraya la importancia de su conservación.',
    summary: 'El tercer planeta del sistema solar, nuestro dinámico hogar cubierto de océanos y el único mundo conocido que alberga una vasta diversidad de vida.'
  },
  { 
    id: 'mars', 
    name: 'Marte', 
    color: '#e26b4b', 
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/600px-OSIRIS_Mars_true_color.jpg',
    size: 32, 
    orbitRadius: 300, 
    speed: 45, 
    desc: 'El planeta rojo, llamado así por el óxido de hierro en su superficie. Tiene el volcán más grande del sistema solar.', 
    details: { Masa: '6.42 × 10^23 kg', Lunas: '2', Gravedad: '3.71 m/s²' },
    introduction: 'Marte es el cuarto planeta en orden de distancia al Sol y el segundo más pequeño del sistema solar, después de Mercurio. También es conocido como "el planeta rojo" debido al óxido de hierro predominante en su superficie. Es un planeta terrestre con una atmósfera delgada y características superficiales que recuerdan tanto a los cráteres de la Luna como a los valles, desiertos y casquetes polares de la Tierra.',
    history: 'Recibió su nombre en homenaje al dios de la guerra de la mitología romana (Ares en la mitología griega). Ha sido objeto de intensa exploración espacial desde la década de 1960, con múltiples rovers (como Curiosity y Perseverance) y orbitadores que han revelado que en el pasado tuvo agua líquida fluyendo en su superficie.',
    keyPoints: ['Alberga el Monte Olimpo, el volcán más grande y la segunda montaña más alta conocida en el sistema solar.', 'Posee Valles Marineris, uno de los cañones más grandes del sistema solar.', 'Tiene dos lunas pequeñas y de forma irregular: Fobos y Deimos.', 'Su atmósfera es muy tenue, compuesta principalmente de dióxido de carbono (95%).', 'Hay evidencia de que hace miles de millones de años era un mundo más cálido y húmedo.'],
    conclusion: 'Marte es el principal candidato para la futura exploración humana y la búsqueda de vida pasada o presente fuera de la Tierra. Su historia geológica nos ofrece una ventana para entender cómo cambian los planetas con el tiempo.',
    summary: 'El planeta rojo, un mundo desértico y frío con características geológicas extremas, una atmósfera tenue y un pasado fascinante que sugiere la presencia de agua líquida.'
  },
  { 
    id: 'jupiter', 
    name: 'Júpiter', 
    color: '#c88b3a', 
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/600px-Jupiter.jpg',
    size: 110, 
    orbitRadius: 420, 
    speed: 80, 
    desc: 'El gigante gaseoso, el planeta más grande del sistema solar, famoso por su Gran Mancha Roja.', 
    details: { Masa: '1.90 × 10^27 kg', Lunas: '95', Gravedad: '24.79 m/s²' },
    introduction: 'Júpiter es el quinto planeta del sistema solar y, con diferencia, el más grande. Forma parte de los denominados planetas exteriores o gaseosos. Su masa es más de dos veces y media la de todos los demás planetas del sistema solar juntos. Es un mundo de tormentas masivas, vientos extremos y auroras espectaculares.',
    history: 'Conocido desde la antigüedad, fue crucial en la revolución copernicana cuando Galileo Galilei descubrió sus cuatro lunas principales (Ío, Europa, Ganimedes y Calisto) en 1610, demostrando que no todos los cuerpos celestes orbitaban la Tierra. Varias sondas lo han visitado, destacando Pioneer, Voyager, Galileo y Juno.',
    keyPoints: ['Es el planeta más grande del sistema solar, compuesto principalmente de hidrógeno y helio.', 'Su Gran Mancha Roja es una tormenta anticiclónica gigante, más grande que la Tierra, que lleva activa cientos de años.', 'Tiene un tenue sistema de anillos y decenas de lunas (actualmente se conocen 95).', 'Ganimedes, una de sus lunas, es el satélite más grande del sistema solar, incluso mayor que el planeta Mercurio.', 'Tiene el día más corto del sistema solar, rotando sobre su eje en menos de 10 horas.'],
    conclusion: 'Como el "rey de los planetas", Júpiter ha jugado un papel fundamental en la formación y dinámica de nuestro sistema solar, actuando como un escudo gravitacional que protege a los planetas interiores de los impactos de cometas y asteroides.',
    summary: 'El gigante gaseoso más grande del sistema solar, famoso por sus tormentas masivas como la Gran Mancha Roja, su rápida rotación y su extenso sistema de lunas.'
  },
  { 
    id: 'saturn', 
    name: 'Saturno', 
    color: '#e3d599', 
    img: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6yiR1EhQxb8NngiEN1h6pX4ktrIjlOZgIHo3eNyqC9SlzKeK16v8579bnR9mMIZKDa4gdWwbYyjF4LYFiN9yHMUTXNVcsqWXQzG4H-xohwY8lgETvt59evk5aFgukXTnjjZ3kCwXLUA2hzc2fPdZeG5ZIhlhhKBrbgl67KkUksjOjpMQP5MCkJiDVFU_w/s1501/Saturno%20sin%20anillo.jpg',
    size: 100, 
    orbitRadius: 550, 
    speed: 120, 
    desc: 'Famoso por sus impresionantes y complejos anillos compuestos principalmente de partículas de hielo y roca.', 
    details: { Masa: '5.68 × 10^26 kg', Lunas: '146', Gravedad: '10.44 m/s²' },
    introduction: 'Saturno es el sexto planeta del sistema solar contando desde el Sol, el segundo en tamaño y masa después de Júpiter y el único con un sistema de anillos visible desde la Tierra. Al igual que Júpiter, es un gigante gaseoso compuesto principalmente de hidrógeno y helio.',
    history: 'Nombrado en honor al dios romano de la agricultura y la cosecha. Sus anillos fueron observados por primera vez por Galileo en 1610, aunque su telescopio no era lo suficientemente potente para comprender su naturaleza, viéndolos como "orejas". Christiaan Huygens fue el primero en describirlos como un disco plano en 1655. La misión Cassini-Huygens proporcionó datos invaluables sobre el planeta y sus lunas.',
    keyPoints: ['Famoso por su extenso, complejo y brillante sistema de anillos, compuesto por innumerables partículas de hielo y roca.', 'Es el planeta menos denso del sistema solar; su densidad es menor que la del agua, por lo que flotaría en un océano lo suficientemente grande.', 'Su luna Titán es la única en el sistema solar con una atmósfera densa y lagos de metano líquido en su superficie.', 'Tiene la mayor cantidad de lunas confirmadas en el sistema solar (146).', 'Presenta una tormenta hexagonal persistente en su polo norte.'],
    conclusion: 'Saturno es considerado a menudo la "joya del sistema solar" debido a la belleza inigualable de sus anillos. Es un mundo complejo y fascinante que sigue sorprendiendo a los científicos con la dinámica de su atmósfera y la diversidad de sus numerosas lunas.',
    summary: 'El segundo planeta más grande, un gigante gaseoso inconfundible gracias a su espectacular y extenso sistema de anillos, y hogar de la fascinante luna Titán.'
  },
  { 
    id: 'uranus', 
    name: 'Urano', 
    color: '#73d2de', 
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/600px-Uranus2.jpg',
    size: 65, 
    orbitRadius: 670, 
    speed: 180, 
    desc: 'Un gigante de hielo que gira de lado sobre su eje, posiblemente debido a una antigua colisión colosal.', 
    details: { Masa: '8.68 × 10^25 kg', Lunas: '28', Gravedad: '8.69 m/s²' },
    introduction: 'Urano es el séptimo planeta del sistema solar, el tercero de mayor tamaño, y el cuarto más masivo. Se llama así en honor de la divinidad griega del cielo Urano. A diferencia de Júpiter y Saturno, Urano es un "gigante de hielo", ya que contiene una mayor proporción de "hielos" como agua, amoníaco y metano.',
    history: 'Fue el primer planeta descubierto con un telescopio, por el astrónomo William Herschel en 1781, ampliando los límites conocidos del sistema solar por primera vez en la historia. Inicialmente, Herschel pensó que era un cometa o una estrella. Hasta la fecha, solo ha sido visitado por una nave espacial, la Voyager 2, en 1986.',
    keyPoints: ['Es un gigante de hielo, con un manto fluido de agua, amoníaco y metano sobre un núcleo rocoso.', 'Su eje de rotación está inclinado casi 98 grados, por lo que "rueda" sobre su órbita, causando temporadas extremas que duran más de 20 años.', 'Tiene la atmósfera planetaria más fría del sistema solar, con temperaturas que descienden hasta -224 °C.', 'Posee un sistema de anillos oscuros y tenues, y 28 lunas conocidas.', 'Su color azul verdoso pálido se debe a la absorción de la luz roja por el metano en su atmósfera superior.'],
    conclusion: 'Urano es un mundo extraño y helado, cuya extrema inclinación lo hace único entre los planetas. Su estudio es crucial para entender la formación de los gigantes de hielo, que parecen ser el tipo de planeta más común en nuestra galaxia.',
    summary: 'Un gigante de hielo inclinado sobre su lado, con un color azul verdoso pálido, un sistema de anillos oscuros y las temperaturas atmosféricas más frías del sistema solar.'
  },
  { 
    id: 'neptune', 
    name: 'Neptuno', 
    color: '#4b70dd', 
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Neptune_Full.jpg/600px-Neptune_Full.jpg',
    size: 60, 
    orbitRadius: 780, 
    speed: 250, 
    desc: 'El planeta más alejado, oscuro, frío y azotado por vientos supersónicos, el más rápido del sistema solar.', 
    details: { Masa: '1.02 × 10^26 kg', Lunas: '16', Gravedad: '11.15 m/s²' },
    introduction: 'Neptuno es el octavo planeta en distancia respecto al Sol y el más lejano del sistema solar. Forma parte de los denominados planetas exteriores, y al igual que Urano, es un gigante de hielo. Es un mundo oscuro, frío y azotado por vientos supersónicos, siendo el planeta más ventoso de nuestro sistema.',
    history: 'Fue el primer planeta descubierto mediante predicciones matemáticas en lugar de observación empírica. El astrónomo Johann Galle lo observó en 1846 basándose en los cálculos de Urbain Le Verrier, quien dedujo su existencia por las perturbaciones en la órbita de Urano. La Voyager 2 es la única nave que lo ha visitado, en 1989.',
    keyPoints: ['Es el planeta con los vientos más fuertes del sistema solar, alcanzando velocidades de hasta 2.100 km/h.', 'Su color azul intenso se debe a la presencia de metano en su atmósfera, aunque hay un componente desconocido que lo hace más azul que Urano.', 'Su luna más grande, Tritón, orbita en dirección retrógrada (opuesta a la rotación del planeta) y es geológicamente activa, con géiseres de nitrógeno.', 'Tiene un sistema de anillos muy tenue y fragmentado, conocido como arcos.', 'A pesar de estar más lejos del Sol, su temperatura es similar a la de Urano, lo que indica una fuente de calor interno significativa.'],
    conclusion: 'Neptuno es un mundo dinámico y tormentoso en los confines del sistema solar. Su descubrimiento fue un triunfo monumental de la mecánica celeste y sigue siendo un objeto de gran interés científico debido a su clima extremo y su peculiar luna Tritón.',
    summary: 'El planeta más lejano, un gigante de hielo azul oscuro con vientos supersónicos, tormentas masivas y un clima extremadamente activo, acompañado por su peculiar luna Tritón.'
  },
];

type PlanetInfo = {
  id?: string;
  name: string;
  color: string;
  size?: number;
  orbitRadius?: number;
  speed?: number;
  desc: string;
  img?: string;
  details: Record<string, string>;
  introduction?: string;
  history?: string;
  keyPoints?: string[];
  conclusion?: string;
  summary?: string;
};

export default function App() {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const [zoom, setZoom] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isSiteInfoOpen, setIsSiteInfoOpen] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has already accepted the privacy policy
    const hasAcceptedPolicy = localStorage.getItem('cosmo_policy_accepted');
    if (!hasAcceptedPolicy) {
      setShowPrivacyPolicy(true);
    }
  }, []);

  const handleAcceptPolicy = () => {
    localStorage.setItem('cosmo_policy_accepted', 'true');
    setShowPrivacyPolicy(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Save user profile to Firestore
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const userData: any = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              createdAt: serverTimestamp()
            };
            if (currentUser.displayName) userData.displayName = currentUser.displayName.substring(0, 100);
            if (currentUser.photoURL) userData.photoURL = currentUser.photoURL.substring(0, 2048);
            
            await setDoc(userRef, userData);
          }
        } catch (error) {
          console.error("Error saving user profile:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Ajustar el zoom para que todo el sistema solar sea visible
  useEffect(() => {
    const handleResize = () => {
      // El diámetro total del sistema solar es aprox 1650px (radio de Neptuno 780 * 2 + padding)
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      // Dejamos un margen del 98% para que ocupe casi toda la pantalla sin salirse
      const newZoom = (minDimension * 0.98) / 1650;
      setZoom(newZoom);
    };

    handleResize(); // Llamada inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050505] to-[#050505] overflow-hidden font-sans selection:bg-indigo-500/30">
      <Starfield />

      {/* Header & Logo */}
      <header className="absolute top-0 left-0 w-full px-6 pt-3 pb-6 z-20 pointer-events-none flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo Geométrico */}
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute w-8 h-8 border-[1.5px] border-white/20 rounded-full" />
            <div className="absolute w-8 h-8 border-[1.5px] border-transparent border-t-white border-r-white rounded-full -rotate-12" />
            <div className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_3px_rgba(167,139,250,0.8)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.2em] text-white leading-none ml-3">
            COSMO
          </h1>
        </div>
        
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
              {user.photoURL && <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />}
              <span className="text-white/80 text-sm font-medium hidden sm:block">{user.displayName}</span>
              <button onClick={handleLogout} className="text-white/50 hover:text-white transition-colors ml-2" title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-500 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              <LogIn size={16} />
              <span>Iniciar Sesión</span>
            </button>
          )}

          {/* Info Button */}
          <button
            onClick={() => setIsSiteInfoOpen(true)}
            className="relative p-3 mt-2 rounded-full bg-gradient-to-br from-yellow-900 via-amber-800 to-orange-900 border border-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:shadow-[0_0_25px_rgba(234,179,8,0.8)] hover:scale-110 transition-all duration-300 group"
            title="Información"
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
            <Info className="text-yellow-200 group-hover:text-white transition-colors relative z-10" size={24} />
          </button>
        </div>
      </header>

      {/* Textos Inferiores */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex flex-col items-end gap-2">
        <p className="text-yellow-400 text-sm sm:text-base font-serif italic tracking-[0.2em] uppercase bg-black/20 backdrop-blur-sm px-4 py-2 rounded-md border border-white/5 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
          Sistema Solar
        </p>
        <p className="text-white/40 text-[10px] sm:text-xs font-mono bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          Haz clic en un astro para explorar
        </p>
      </div>

      {/* Solar System Canvas */}
      <motion.div
        ref={containerRef}
        className="absolute inset-0"
      >
        <motion.div
          className="absolute top-1/2 left-1/2 w-0 h-0"
          animate={{ scale: zoom }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Sun */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform z-10 flex items-center justify-center"
            style={{ width: 160, height: 160 }}
            onClick={() => setSelectedPlanet({
              id: 'sun',
              name: 'Sol',
              color: '#ffaa00',
              img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/600px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
              desc: 'La estrella en el centro de nuestro sistema solar. Es una esfera casi perfecta de plasma caliente que sostiene la vida en la Tierra.',
              details: { Masa: '1.989 × 10^30 kg', Tipo: 'Enana amarilla', Temperatura: '5,500 °C' },
              introduction: 'El Sol es la estrella en el centro del sistema solar. Es una esfera casi perfecta de plasma caliente, con movimiento convectivo interno que genera un campo magnético a través de un proceso de dinamo. Es, con diferencia, la fuente de energía más importante para la vida en la Tierra y el ancla gravitacional que mantiene unido a todo el sistema.',
              history: 'Formado hace aproximadamente 4.600 millones de años a partir del colapso gravitacional de la materia dentro de una región de una gran nube molecular. La mayor parte de esta materia se acumuló en el centro, volviéndose cada vez más caliente y densa, hasta iniciar la fusión nuclear en su núcleo. El resto de la materia se aplanó en un disco protoplanetario que eventualmente formó los planetas, lunas, asteroides y cometas.',
              keyPoints: ['Es una estrella de tipo-G de la secuencia principal (G2V), a menudo llamada erróneamente "enana amarilla".', 'Contiene el 99.86% de la masa total del sistema solar.', 'Su energía sostiene casi toda la vida en la Tierra a través de la fotosíntesis y determina el clima y la meteorología de la Tierra.', 'En su núcleo, fusiona unos 600 millones de toneladas de hidrógeno en helio cada segundo.', 'Se espera que continúe en su fase actual durante unos 5.000 millones de años más, antes de convertirse en una gigante roja.'],
              conclusion: 'El Sol es el motor absoluto de nuestro sistema. Su inmensa gravedad mantiene a los planetas en sus órbitas, y la energía que irradia es el requisito fundamental para la existencia y el mantenimiento de la vida tal como la conocemos en nuestro planeta.',
              summary: 'La estrella central y masiva del sistema solar, compuesta principalmente de hidrógeno y helio, cuya energía de fusión nuclear es esencial para la vida en la Tierra.'
            })}
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 80px 30px rgba(255, 170, 0, 0.3)' }} />
            {/* Image */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/600px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg)',
                backgroundSize: '140%',
                backgroundPosition: 'center',
                mixBlendMode: 'screen'
              }}
            />
          </div>

          {/* Orbits (Clickable) */}
          <svg 
            className="absolute top-1/2 left-1/2 pointer-events-none z-0" 
            style={{ 
              width: '4000px', 
              height: '4000px', 
              transform: 'translate(-50%, -50%)' 
            }}
            viewBox="-2000 -2000 4000 4000"
          >
            {PLANETS.map((planet) => (
              <g 
                key={`orbit-${planet.id}`} 
                className="group cursor-pointer" 
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setSelectedPlanet(planet); 
                }}
              >
                {/* Visible thin line */}
                <circle
                  cx="0"
                  cy="0"
                  r={planet.orbitRadius}
                  fill="none"
                  className="stroke-white/10 group-hover:stroke-white/50 transition-colors duration-300"
                  strokeWidth="1"
                />
                {/* Invisible thick line for clicking */}
                <circle
                  cx="0"
                  cy="0"
                  r={planet.orbitRadius}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="30"
                  style={{ pointerEvents: 'stroke' }}
                />
              </g>
            ))}
          </svg>

          {/* Planets */}
          {PLANETS.map((planet) => (
            <div
              key={planet.id}
              className="absolute top-1/2 left-1/2 rounded-full animate-orbit pointer-events-none"
              style={{
                width: planet.orbitRadius * 2,
                height: planet.orbitRadius * 2,
                animationDuration: `${planet.speed}s`
              }}
            >
              <div
                className="absolute cursor-pointer transition-all hover:scale-150 group flex items-center justify-center pointer-events-auto"
                style={{
                  width: planet.size,
                  height: planet.size,
                  top: -planet.size / 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlanet(planet);
                }}
              >
                {/* Black background for Saturn to hide orbit line */}
                {planet.id === 'saturn' && (
                  <div className="absolute w-[40%] h-[40%] bg-black rounded-full" />
                )}
                
                {/* Saturn Back Ring */}
                {planet.id === 'saturn' && (
                  <div 
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: '280%',
                      height: '280%',
                      background: 'radial-gradient(circle, transparent 38%, rgba(227, 213, 153, 0.8) 39%, rgba(227, 213, 153, 0.4) 48%, transparent 49%, rgba(227, 213, 153, 0.5) 51%, rgba(227, 213, 153, 0.2) 62%, transparent 64%)',
                      transform: 'rotateX(75deg)',
                      zIndex: 0,
                      clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                    }}
                  />
                )}

                {/* Black background for Saturn to hide back ring showing through */}
                {planet.id === 'saturn' && (
                  <div className="absolute w-[98%] h-[98%] bg-black rounded-full z-[5]" />
                )}
                
                {/* Planet Image */}
                <div 
                  className={`absolute w-full h-full overflow-hidden rounded-full z-10`}
                  style={{
                    backgroundColor: planet.img ? (planet.id === 'neptune' ? '#000' : 'transparent') : planet.color,
                    backgroundImage: planet.img ? `url(${planet.img})` : 'none',
                    backgroundSize: planet.id === 'saturn' ? 'auto 220%' : planet.id === 'uranus' ? '220%' : planet.id === 'neptune' ? '95%' : 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: planet.id === 'saturn' ? 'center 55%' : 'center',
                    boxShadow: planet.img ? (['saturn', 'jupiter'].includes(planet.id) ? 'none' : 'inset -10px -10px 20px rgba(0,0,0,0.8)') : `inset -8px -8px 12px rgba(0,0,0,0.5), 0 0 15px ${planet.color}40`,
                    mixBlendMode: ['saturn', 'jupiter'].includes(planet.id) ? 'screen' : 'normal'
                  }}
                />

                {/* Saturn Front Ring */}
                {planet.id === 'saturn' && (
                  <div 
                    className="absolute rounded-full pointer-events-none z-20"
                    style={{
                      width: '280%',
                      height: '280%',
                      background: 'radial-gradient(circle, transparent 38%, rgba(227, 213, 153, 0.9) 39%, rgba(227, 213, 153, 0.5) 48%, transparent 49%, rgba(227, 213, 153, 0.6) 51%, rgba(227, 213, 153, 0.3) 62%, transparent 64%)',
                      transform: 'rotateX(75deg)',
                      clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
                    }}
                  />
                )}

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-md whitespace-nowrap border border-white/10 shadow-xl z-20">
                  {planet.name}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Info Panel */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full sm:w-[400px] bg-black/70 backdrop-blur-2xl border-l border-white/10 p-8 z-30 overflow-y-auto shadow-2xl"
          >
            <button
              onClick={() => setSelectedPlanet(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/20 transition-colors border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="mt-12 pb-12">
              <div className="flex flex-col items-center justify-center gap-5 mb-10 mt-4">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  {/* Saturn Back Ring */}
                  {selectedPlanet.id === 'saturn' && (
                    <div 
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: '280%',
                        height: '280%',
                        background: 'radial-gradient(circle, transparent 38%, rgba(227, 213, 153, 0.8) 39%, rgba(227, 213, 153, 0.4) 48%, transparent 49%, rgba(227, 213, 153, 0.5) 51%, rgba(227, 213, 153, 0.2) 62%, transparent 64%)',
                        transform: 'rotateX(75deg)',
                        zIndex: 0,
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                      }}
                    />
                  )}

                  {/* Black background for Saturn to hide back ring showing through */}
                  {selectedPlanet.id === 'saturn' && (
                    <div className="absolute w-[98%] h-[98%] bg-black rounded-full z-[5]" />
                  )}

                  <div
                    className={`w-full h-full border border-white/20 rounded-full z-10 relative`}
                    style={{
                      backgroundColor: selectedPlanet.img ? (selectedPlanet.id === 'neptune' ? '#000' : 'transparent') : selectedPlanet.color,
                      backgroundImage: selectedPlanet.img ? `url(${selectedPlanet.img})` : 'none',
                      backgroundSize: selectedPlanet.id === 'saturn' ? 'auto 220%' : selectedPlanet.id === 'uranus' ? '220%' : selectedPlanet.id === 'neptune' ? '95%' : 'cover',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: selectedPlanet.id === 'saturn' ? 'center 55%' : 'center',
                      boxShadow: selectedPlanet.img ? 'none' : `0 0 40px ${selectedPlanet.color}60, inset -8px -8px 20px rgba(0,0,0,0.5)`,
                      mixBlendMode: ['saturn', 'jupiter'].includes(selectedPlanet.id) ? 'screen' : 'normal'
                    }}
                  />

                  {/* Saturn Front Ring */}
                  {selectedPlanet.id === 'saturn' && (
                    <div 
                      className="absolute rounded-full pointer-events-none z-20"
                      style={{
                        width: '280%',
                        height: '280%',
                        background: 'radial-gradient(circle, transparent 38%, rgba(227, 213, 153, 0.9) 39%, rgba(227, 213, 153, 0.5) 48%, transparent 49%, rgba(227, 213, 153, 0.6) 51%, rgba(227, 213, 153, 0.3) 62%, transparent 64%)',
                        transform: 'rotateX(75deg)',
                        clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
                      }}
                    />
                  )}
                </div>
                <h2 className="text-4xl font-bold tracking-tighter text-center">{selectedPlanet.name}</h2>
              </div>

              {selectedPlanet.introduction ? (
                <div className="mb-8">
                  <p className="text-white/80 text-base leading-relaxed font-light">
                    {selectedPlanet.introduction}
                  </p>
                </div>
              ) : (
                <p className="text-white/70 text-lg leading-relaxed mb-10 font-light">
                  {selectedPlanet.desc}
                </p>
              )}

              {selectedPlanet.history && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-2 mb-3">
                    Historia
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed font-light">
                    {selectedPlanet.history}
                  </p>
                </div>
              )}

              {selectedPlanet.keyPoints && selectedPlanet.keyPoints.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-2 mb-3">
                    Puntos Clave
                  </h3>
                  <ul className="list-disc list-outside ml-4 text-white/70 text-sm leading-relaxed font-light space-y-1">
                    {selectedPlanet.keyPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-3 mb-6">
                  Datos Técnicos
                </h3>
                {Object.entries(selectedPlanet.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-white/60 font-medium">{key}</span>
                    <span className="font-mono text-sm text-white/90">{value}</span>
                  </div>
                ))}
              </div>

              {selectedPlanet.conclusion && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-2 mb-3">
                    Conclusión
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed font-light italic">
                    {selectedPlanet.conclusion}
                  </p>
                </div>
              )}

              {selectedPlanet.summary && (
                <div className="mb-8 bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-2">
                    Resumen
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed font-medium">
                    {selectedPlanet.summary}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Extra Button */}
      <button
        onClick={() => setIsNewsOpen(true)}
        className="fixed bottom-[100px] left-6 sm:bottom-6 sm:left-[100px] p-4 rounded-full bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_35px_rgba(59,130,246,0.8)] hover:scale-110 transition-all duration-300 z-40 group"
        title="Noticias Espaciales"
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
        <Newspaper className="text-blue-200 group-hover:text-white transition-colors relative z-10" size={28} />
      </button>

      {/* Space News Panel */}
      <SpaceNews isOpen={isNewsOpen} onClose={() => setIsNewsOpen(false)} />

      {/* Site Info Modal */}
      <SiteInfo isOpen={isSiteInfoOpen} onClose={() => setIsSiteInfoOpen(false)} />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={showPrivacyPolicy} onAccept={handleAcceptPolicy} />

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}

// Componente para generar el fondo de estrellas
function Starfield() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; opacity: number }[]>([]);

  useEffect(() => {
    // Generar estrellas aleatorias una sola vez al montar
    const generatedStars = Array.from({ length: 300 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.7 + 0.1,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${star.y}%`,
            left: `${star.x}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            boxShadow: star.size > 2 ? '0 0 4px rgba(255,255,255,0.8)' : 'none'
          }}
        />
      ))}
    </div>
  );
}
