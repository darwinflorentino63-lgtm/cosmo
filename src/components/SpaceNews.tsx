import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Loader2, Newspaper, Languages } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

interface Article {
  id: number;
  title: string;
  url: string;
  image_url: string;
  summary: string;
  published_at: string;
  news_site: string;
}

export function SpaceNews({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [news, setNews] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Record<number, string>>({});
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    if (isOpen && news.length === 0) {
      fetchNews();
    }
  }, [isOpen, news.length]);

  const expandArticle = async (article: Article) => {
    setSelectedArticle(article);
    if (expandedArticles[article.id]) return;

    setIsExpanding(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Actúa como un periodista experto en astronomía. Escribe un artículo de noticias completo, detallado y cautivador en español basado en esta información:
      Titular: "${article.title}"
      Resumen: "${article.summary}"
      
      El artículo debe tener al menos 3 párrafos, incluir contexto científico relevante y estar escrito en un tono informativo y accesible. No uses formato markdown complejo, solo texto plano con saltos de línea para separar los párrafos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setExpandedArticles(prev => ({ ...prev, [article.id]: response.text || article.summary }));
    } catch (error) {
      console.error('Error expanding article:', error);
      setExpandedArticles(prev => ({ ...prev, [article.id]: article.summary }));
    } finally {
      setIsExpanding(false);
    }
  };

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      // Fetch latest news
      const response = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=10');
      const data = await response.json();
      const articles: Article[] = data.results;

      // Translate using Gemini (invisible to the user)
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `
Traduce al español los siguientes títulos y resúmenes de noticias espaciales.
Mantén el mismo orden y devuelve un JSON estricto con la estructura:
[
  { "title": "título traducido", "summary": "resumen traducido" }
]

Noticias:
${JSON.stringify(articles.map(a => ({ title: a.title, summary: a.summary })))}
`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING }
              }
            }
          }
        }
      });

      let translatedArticles = articles;
      try {
        const translatedData = JSON.parse(aiResponse.text || '[]');
        translatedArticles = articles.map((a, i) => ({
          ...a,
          title: translatedData[i]?.title || a.title,
          summary: translatedData[i]?.summary || a.summary
        }));
      } catch (e) {
        console.error('Error parsing translation:', e);
      }

      setNews(translatedArticles);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
          initial={{ opacity: 0, x: '-100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 left-0 h-full w-full sm:w-[400px] bg-[#09090e]/95 backdrop-blur-2xl border-r border-blue-500/30 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        >
          <div className="flex flex-col p-5 border-b border-blue-500/20 bg-black/40 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Newspaper className="text-blue-400" size={24} />
                <h2 className="text-lg font-bold text-blue-100 tracking-wide">
                  Noticias Espaciales
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition-colors border border-white/10 text-white/70 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-blue-400 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                  <Loader2 className="animate-spin relative z-10 text-blue-300" size={40} />
                </div>
                <p className="text-sm font-medium animate-pulse text-blue-200">Cargando noticias...</p>
              </div>
            ) : news.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/50 gap-3 text-center px-4">
                <p>No se encontraron noticias recientes.</p>
              </div>
            ) : (
              news.map((article) => (
                <button
                  key={article.id}
                  onClick={() => expandArticle(article)}
                  className="block w-full text-left bg-white/5 border border-blue-500/20 rounded-xl overflow-hidden hover:bg-white/10 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all group relative z-10"
                >
                  <div className="h-48 w-full overflow-hidden relative bg-black/50">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Imagen de respaldo por si falla la original
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-12">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 bg-blue-900/80 px-2 py-1 rounded backdrop-blur-md border border-blue-400/30">
                        {article.news_site}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-3 mb-4 leading-relaxed">
                      {article.summary}
                    </p>
                    <div className="flex items-center justify-between text-white/40 text-[10px] font-medium uppercase tracking-wider">
                      <span>{new Date(article.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <div className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300">
                        <span>Leer más</span>
                        <ExternalLink size={12} />
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Modal de Artículo Expandido */}
    <AnimatePresence>
      {selectedArticle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedArticle(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#09090e] border border-blue-500/30 rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors border border-white/10 text-white/70 hover:text-white backdrop-blur-md"
            >
              <X size={20} />
            </button>
            
            <div className="h-64 w-full relative shrink-0">
              <img
                src={selectedArticle.image_url}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090e] to-transparent" />
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-blue-900/80 px-2 py-1 rounded border border-blue-400/30">
                  {selectedArticle.news_site}
                </span>
                <span className="text-xs text-white/50">
                  {new Date(selectedArticle.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-6 leading-tight">
                {selectedArticle.title}
              </h2>
              
              {isExpanding && !expandedArticles[selectedArticle.id] ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-blue-400">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-sm animate-pulse">Generando artículo completo con IA...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-blue max-w-none">
                  {expandedArticles[selectedArticle.id]?.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && <p key={idx} className="text-white/80 leading-relaxed mb-4">{paragraph}</p>
                  ))}
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                <p className="text-xs text-white/40">Artículo expandido por Gemini AI</p>
                <a 
                  href={selectedArticle.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Ver fuente original</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
