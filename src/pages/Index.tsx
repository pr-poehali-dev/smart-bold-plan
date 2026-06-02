import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

export default function Index() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rotation, setRotation] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;
      setRotation(prev => prev + delta * 0.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const projects = [
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/9931de50-f284-450a-9132-0aa4c921519d.jpg', title: 'Гос. заказы', desc: 'Выполняем государственные заказы — реквизит и костюмы для театров и учреждений культуры' },
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/bce5e7f0-9524-4efc-8ea3-8b7413a2af40.jpg', title: 'Шлем воина', desc: 'Детализированный шлем в стиле античного доспеха для театральной постановки' },
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/5d7a0ff6-337b-44f1-a131-175ebfed5039.jpg', title: 'Игрушки на заказ', desc: 'Выполняем печать игрушек в большом количестве' },
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/5f95621c-bb20-45af-b282-0d46117faf0c.jpg', title: 'Фигурки под заказ', desc: 'От моделинга до готовой фигурки под вашу задумку' },
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/ef26180b-32b6-4f4e-984b-12eddc1d2fc5.jpg', title: 'Детали и аксессуары', desc: 'Детали и аксессуары под любую задачу — точно и в срок' },
  ];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = (e: React.MouseEvent) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i - 1 + projects.length) % projects.length : null); };
  const nextPhoto = (e: React.MouseEvent) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i + 1) % projects.length : null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('https://functions.poehali.dev/2a6f2b39-1c29-455f-9afc-21cab050870f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-black">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <a href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <span
              style={{ display: 'inline-block', transform: `rotate(${rotation}deg)` }}
            >
              <Icon name="Box" size={22} />
            </span>
            FORM3D
          </a>
          <div className="flex space-x-8">
            <a href="#work" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Работы
            </a>
            <a href="#about" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              О нас
            </a>
            <a href="#contact" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Контакты
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 container mx-auto">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7 mb-8 md:mb-0">
            <h1 className="text-8xl md:text-9xl font-bold tracking-tighter leading-none mb-6">
              3D
              <br />
              ФОРМА
            </h1>
            <p className="text-xl max-w-xl">
              Моделируем. Печатаем. Воплощаем. Превращаем ваши идеи в точные физические объекты — от концепта до готового изделия.
            </p>
            <a
              href="#contact"
              className="inline-block mt-8 px-8 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-red-600 transition-colors"
            >
              Заказать модель
            </a>
          </div>
          <div className="col-span-12 md:col-span-5 flex items-center justify-center">
            <div className="relative w-full aspect-square bg-red-600">
              <img
                src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/7917010b-8bac-4e03-bad5-c64af73384af.jpg"
                alt="3D печать"
                className="w-full h-full object-cover"
              />

            </div>
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="py-20 px-4 md:px-8 bg-black text-white">
        <div className="container mx-auto">
          <h2 className="text-6xl font-bold tracking-tighter mb-12">РАБОТЫ</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {projects.map((project, index) => (
              <div key={index} className="group cursor-pointer" onClick={() => openLightbox(index)}>
                <div className="aspect-square bg-white mb-4 overflow-hidden">
                  <img
                    src={project.src}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-neutral-400 text-sm">{project.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors"
            onClick={closeLightbox}
          >
            <Icon name="X" size={32} />
          </button>
          <button
            className="absolute left-4 text-white hover:text-neutral-300 transition-colors bg-black/40 rounded-full p-2"
            onClick={prevPhoto}
          >
            <Icon name="ChevronLeft" size={36} />
          </button>
          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={projects[lightboxIndex].src}
              alt={projects[lightboxIndex].title}
              className="max-w-[80vw] max-h-[80vh] object-contain"
            />
            <p className="text-white mt-4 text-lg font-semibold">{projects[lightboxIndex].title}</p>
            <p className="text-neutral-400 text-sm mt-1">{lightboxIndex + 1} / {projects.length}</p>
          </div>
          <button
            className="absolute right-4 text-white hover:text-neutral-300 transition-colors bg-black/40 rounded-full p-2"
            onClick={nextPhoto}
          >
            <Icon name="ChevronRight" size={36} />
          </button>
        </div>
      )}

      {/* About Section */}
      <section id="about" className="py-20 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-5">
              <h2 className="text-6xl font-bold tracking-tighter mb-8">О НАС</h2>
              <div className="aspect-[4/5] bg-neutral-100 relative mb-8 md:mb-0 overflow-hidden">
                <img
                  src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/files/fba6bc59-2b94-4da6-96c6-931375beeb13.jpg"
                  alt="Студия 3D"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-white opacity-30"></div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-7 md:pt-24">
              <p className="text-xl mb-6">
                FORM3D — студия 3D-моделирования и печати, где идеи обретают физическую форму. Мы работаем с точностью инженера и видением дизайнера.
              </p>
              <p className="mb-6">
                Наш процесс включает полный цикл: от разработки 3D-модели по вашим эскизам или техническому заданию — до готового напечатанного изделия. Работаем с пластиком и фотополимером.
              </p>
              <p className="mb-6">
                Подходим для архитекторов, инженеров, дизайнеров, производств и всех, кому нужен качественный физический прототип или уникальный объект.
              </p>
              <div className="mt-12">
                <h3 className="text-sm uppercase tracking-widest mb-6 text-neutral-400">Услуги</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: 'Box', text: 'Моделирование' },
                    { icon: 'FileText', text: 'Составление брифа и ТЗ' },
                    { icon: 'Image', text: 'Помощь с подбором референсов' },
                    { icon: 'Video', text: 'Видео-обсуждение задачи' },
                    { icon: 'Clock', text: 'Помощь с постановкой дедлайнов' },
                    { icon: 'Palette', text: 'Совместный подбор материала и палитры' },
                    { icon: 'Layers', text: 'Этапы моделирования с разбором и советами' },
                    { icon: 'Printer', text: '3D-печать и литьё фотополимера' },
                    { icon: 'Sparkles', text: 'Постобработка' },
                    { icon: 'Package', text: 'Упаковка и отправка готового изделия' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors">
                      <Icon name={item.icon} size={18} className="mt-0.5 shrink-0 text-neutral-500" />
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 md:px-8 bg-red-600 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-6xl font-bold tracking-tighter mb-8">КОНТАКТЫ</h2>
              <p className="text-xl mb-8">Есть задача? Расскажите — рассчитаем стоимость и сроки бесплатно.</p>
              <div className="space-y-4">
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Почта</span>
                  <a href="mailto:3DFormRussia@gmail.com" className="hover:underline">
                    3DFormRussia@gmail.com
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Телефон</span>
                  <a href="tel:+79787258504" className="hover:underline">
                    +7 (978) 725-85-04
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Адрес</span>
                  <span>Евпатория, Россия</span>
                </p>
              </div>
            </div>
            <div>
              {status === 'success' ? (
                <div className="flex flex-col justify-center h-full py-12">
                  <p className="text-3xl font-bold tracking-tighter mb-4">Заявка отправлена!</p>
                  <p className="text-white/80">Мы свяжемся с вами в ближайшее время.</p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="name" className="block text-sm uppercase tracking-widest mb-2">
                      Имя
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-white py-2 px-0 focus:outline-none focus:border-black placeholder-white/50"
                      placeholder="Ваше имя"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm uppercase tracking-widest mb-2">
                      Почта
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-white py-2 px-0 focus:outline-none focus:border-black placeholder-white/50"
                      placeholder="Ваш email"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm uppercase tracking-widest mb-2">
                      Задача
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-white py-2 px-0 focus:outline-none focus:border-black placeholder-white/50"
                      placeholder="Опишите вашу задачу — что нужно смоделировать и напечатать?"
                      required
                    ></textarea>
                  </div>
                  {status === 'error' && (
                    <p className="text-white/80 text-sm">Ошибка отправки. Попробуйте ещё раз.</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="mt-8 px-8 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? 'Отправляем...' : 'Отправить заявку'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 bg-black text-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">2025 FORM3D Studio. Все права защищены.</p>
          <div className="flex space-x-8">
            <a href="#" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Instagram
            </a>
            <a href="#" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Behance
            </a>
            <a href="#" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Telegram
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}