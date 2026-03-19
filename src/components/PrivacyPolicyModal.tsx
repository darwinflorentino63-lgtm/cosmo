import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Database, Bot, Check } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function PrivacyPolicyModal({ isOpen, onAccept }: PrivacyPolicyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl shadow-indigo-900/20 relative overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Background decoration */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <ShieldCheck className="text-indigo-400" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white">Políticas de Seguridad y Privacidad</h2>
            </div>

            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-6">
              <p className="text-white/80 text-sm leading-relaxed">
                Bienvenido a <strong>COSMO</strong>. Antes de comenzar tu viaje espacial, queremos asegurarnos de que conozcas cómo protegemos tu información y tu experiencia en nuestra plataforma.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="text-indigo-400 mt-1 shrink-0" size={18} />
                  <div>
                    <h3 className="text-white font-medium text-sm">Protección de Datos</h3>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">
                      No recopilamos información personal sensible. Si decides iniciar sesión, solo utilizamos tu perfil público básico (nombre y correo) para personalizar tu experiencia. Tus datos están seguros y no se venden a terceros.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Bot className="text-indigo-400 mt-1 shrink-0" size={18} />
                  <div>
                    <h3 className="text-white font-medium text-sm">Interacciones con AstroBot</h3>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">
                      Las preguntas que le haces a AstroBot son procesadas para brindarte respuestas educativas sobre astronomía. Te pedimos no compartir información personal o privada en el chat.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Database className="text-indigo-400 mt-1 shrink-0" size={18} />
                  <div>
                    <h3 className="text-white font-medium text-sm">Uso de Cookies y Almacenamiento Local</h3>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">
                      Utilizamos el almacenamiento local de tu navegador exclusivamente para guardar tus preferencias (como haber aceptado este mensaje) y mejorar el rendimiento de la aplicación en 3D.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl mt-4">
                <p className="text-indigo-200/80 text-xs text-center">
                  Al continuar usando COSMO, aceptas estas políticas. Proyecto educativo creado por Darwin Florentino.
                </p>
              </div>
            </div>

            <div className="shrink-0 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={onAccept}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full sm:w-auto justify-center"
              >
                <Check size={18} />
                Aceptar y Comenzar a Explorar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
