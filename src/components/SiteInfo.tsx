import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Code, Calendar, Rocket, Heart, Bot } from 'lucide-react';

interface SiteInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SiteInfo({ isOpen, onClose }: SiteInfoProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900/90 border border-yellow-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-yellow-900/20 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Background decoration */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Info className="text-yellow-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Sobre el Proyecto</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-400/80">
                  <Rocket size={16} />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Propósito</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Esta aplicación fue creada para educar e inspirar a las personas sobre las maravillas de nuestro vecindario cósmico, ofreciendo una experiencia interactiva y accesible en 3D del Sistema Solar.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-400/80">
                  <Heart size={16} />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Creación</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Creado por <strong>Darwin Florentino</strong> (nacido en 2011, República Dominicana) con pasión por la astronomía y la tecnología web moderna. Diseñado para curiosos, estudiantes y exploradores del espacio de todas las edades.
                </p>
              </div>

              <div className="space-y-2 bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-400">
                  <Bot size={18} />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Conoce a AstroBot</h3>
                </div>
                <p className="text-blue-100/80 text-sm leading-relaxed italic">
                  "¡Hola, terrícola! Soy AstroBot, tu asistente virtual y guía turístico por el cosmos. Mi propósito es acompañarte en este viaje estelar, responder todas tus dudas sobre planetas, estrellas y galaxias, y asegurarme de que tu exploración sea tan educativa como divertida. ¡Pregúntame lo que quieras!"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="flex items-center gap-2 text-white/50 mb-1">
                    <Calendar size={14} />
                    <span className="text-xs uppercase tracking-wider">Publicación</span>
                  </div>
                  <p className="text-white/90 text-sm font-medium">Marzo 2026</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/50 mb-1">
                    <Code size={14} />
                    <span className="text-xs uppercase tracking-wider">Versión</span>
                  </div>
                  <p className="text-white/90 text-sm font-medium">1.0.0</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
