import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Navbar from '@/components/Navbar';
import { useLang } from '@/context/LanguageContext';

export default function Index() {
  const { t } = useLang();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const navigate = useNavigate();
  const [rotationY, setRotationY] = useState(0);
  const lastScrollY = useRef(0);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;
      setRotationY(prev => prev + delta * 0.1);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const projects = [
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/9931de50-f284-450a-9132-0aa4c921519d.jpg', title: 'Гос. заказы', desc: 'Выполняем государственные заказы — реквизит и костюмы для театров и учреждений культуры' },
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/bce5e7f0-9524-4efc-8ea3-8b7413a2af40.jpg', title: 'Шлем воина', desc: 'Детализированный шлем в стиле античного доспеха для театральной постановки' },
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/5d7a0ff6-337b-44f1-a131-175ebfed5039.jpg', title: 'Игрушки на заказ', desc: 'Выполняем печать игрушек в большом количестве' },
    { src: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/2b16d5d9-821d-4bcb-b868-be9c479fb257.jpg', title: 'Фигурки под заказ', desc: 'От моделинга до готовой фигурки под вашу задумку' },
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
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 relative overflow-x-hidden transition-colors duration-300">

      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-4 md:px-8 container mx-auto">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7 mb-6 md:mb-0">
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-bold tracking-tighter leading-none mb-4 md:mb-6 dark:text-white">
              <span className="text-pink">3D</span>
              <br />
              {t('ФОРМА')}
            </h1>
            <p className="text-base md:text-xl max-w-xl dark:text-neutral-300">
              {t('Моделируем. Печатаем. Воплощаем. Превращаем ваши идеи в точные физические объекты — от концепта до готового изделия.')}
            </p>
            <a
              href="#contact"
              className="inline-block mt-8 px-10 py-4 bg-black dark:bg-white dark:text-black text-white text-base uppercase tracking-widest hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors rounded-xl"
            >
              {t('Написать нам')}
            </a>
          </div>
          <div className="col-span-12 md:col-span-5 flex items-center justify-center">
            <div className="relative w-full aspect-square bg-neutral-900 dark:rounded-full overflow-hidden transition-all duration-500">
              <img
                src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/7917010b-8bac-4e03-bad5-c64af73384af.jpg"
                alt={t('3D печать')}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="py-12 md:py-20 bg-black text-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 md:mb-12">{t('РАБОТЫ')}</h2>
        </div>

        {/* Desktop: Cards row */}
        <div className="hidden md:flex h-[70vh] min-h-[420px] max-h-[640px]">
          {projects.map((project, index) => (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className="relative flex-1 overflow-hidden cursor-pointer border-r border-white/10 last:border-r-0 transition-all duration-500 ease-in-out group"
              style={{ flexBasis: '20%' }}
              onMouseEnter={e => { e.currentTarget.style.flexBasis = '40%'; }}
              onMouseLeave={e => { e.currentTarget.style.flexBasis = '20%'; }}
            >
              <img
                src={project.src}
                alt={t(project.title)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors duration-500" />
              <div className="absolute top-5 left-0 right-0 px-4 flex items-center gap-3">
                <span className="w-6 h-px bg-pink shrink-0" />
                <span className="text-xs font-semibold tracking-widest text-white/60">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg md:text-xl font-bold leading-tight mb-2 tracking-tight">
                  {t(project.title)}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed max-h-0 overflow-hidden opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                  {t(project.desc)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden px-4">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
            {projects.map((project, index) => (
              <div
                key={index}
                onClick={() => openLightbox(index)}
                className="relative shrink-0 w-[80vw] h-[60vw] rounded-2xl overflow-hidden cursor-pointer snap-start"
              >
                <img
                  src={project.src}
                  alt={t(project.title)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="w-5 h-px bg-pink shrink-0" />
                  <span className="text-xs font-semibold tracking-widest text-white/60">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base font-bold leading-tight tracking-tight mb-1">
                    {t(project.title)}
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {t(project.desc)}
                  </p>
                </div>
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
            {projects[lightboxIndex].model3d ? (
              <div className="w-[80vw] h-[70vh] bg-black">
                <FoxModel className="w-full h-full" />
              </div>
            ) : (
              <img
                src={projects[lightboxIndex].src}
                alt={t(projects[lightboxIndex].title)}
                className="max-w-[80vw] max-h-[80vh] object-contain"
              />
            )}
            <p className="text-white mt-4 text-lg font-semibold">{t(projects[lightboxIndex].title)}</p>
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
      <section id="about" className="py-12 md:py-20 px-4 md:px-8 overflow-hidden dark:bg-neutral-950 transition-colors duration-300">
        <div className="w-full max-w-full">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-5">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 md:mb-8 dark:text-white">{t('О НАС')}</h2>
              <div className="aspect-[4/5] bg-neutral-100 dark:bg-neutral-800 relative mb-8 md:mb-0 overflow-hidden w-full">
                <img
                  src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/d67f40c2-5839-486c-bd13-3abbc7854f64.jpg"
                  alt={t('Студия 3D')}
                  className="w-full h-full object-cover"
                />

              </div>
            </div>
            <div className="col-span-12 md:col-span-7 md:pt-24">
              <p className="text-xl md:text-2xl mb-4 md:mb-6 dark:text-neutral-200">
                <span className="text-pink">FORM3D</span>{t(' — студия 3D-моделирования и печати, где идеи обретают физическую форму. Мы работаем с точностью инженера и видением дизайнера.')}
              </p>
              <p className="text-base md:text-xl mb-4 md:mb-6 dark:text-neutral-400">
                {t('Наш процесс включает полный цикл: от разработки 3D-модели по вашим эскизам или техническому заданию — до готового напечатанного изделия. Работаем с пластиком и фотополимером.')}
              </p>
              <p className="text-base md:text-xl mb-4 md:mb-6 dark:text-neutral-400">
                {t('Подходим для архитекторов, инженеров, дизайнеров, производств и всех, кому нужен качественный физический прототип или уникальный объект.')}
              </p>

            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 md:py-20 px-4 md:px-8 bg-black dark:bg-neutral-900 text-white transition-colors duration-300">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 md:mb-8 text-pink">{t('КОНТАКТЫ')}</h2>
              <p className="text-xl mb-8 dark:text-neutral-300">{t('Есть задача? Расскажите — рассчитаем стоимость и сроки бесплатно.')}</p>
              <div className="space-y-4">
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest dark:text-neutral-400">{t('Почта')}</span>
                  <a href="mailto:3dformrussia@gmail.com" className="hover:underline dark:text-neutral-200">
                    3dformrussia@gmail.com
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest dark:text-neutral-400">{t('Телефон')}</span>
                  <a href="tel:+79787258504" className="hover:underline dark:text-neutral-200">
                    +7 (978) 725-85-04
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest dark:text-neutral-400">{t('Адрес')}</span>
                  <span className="dark:text-neutral-200">{t('Евпатория, Россия')}</span>
                </p>
              </div>
            </div>
            <div>
              {status === 'success' ? (
                <div className="flex flex-col justify-center h-full py-12">
                  <p className="text-3xl font-bold tracking-tighter mb-4">{t('Заявка отправлена!')}</p>
                  <p className="text-white/80 dark:text-neutral-400">{t('Мы свяжемся с вами в ближайшее время.')}</p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="name" className="block text-sm uppercase tracking-widest mb-2 dark:text-neutral-300">
                      {t('Имя')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-white dark:border-neutral-600 py-2 px-0 focus:outline-none focus:border-black dark:focus:border-white placeholder-white/50 dark:placeholder-neutral-500 dark:text-white"
                      placeholder={t('Ваше имя')}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm uppercase tracking-widest mb-2 dark:text-neutral-300">
                      {t('Телефон')}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-white dark:border-neutral-600 py-2 px-0 focus:outline-none focus:border-black dark:focus:border-white placeholder-white/50 dark:placeholder-neutral-500 dark:text-white"
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm uppercase tracking-widest mb-2 dark:text-neutral-300">
                      {t('Почта')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-white dark:border-neutral-600 py-2 px-0 focus:outline-none focus:border-black dark:focus:border-white placeholder-white/50 dark:placeholder-neutral-500 dark:text-white"
                      placeholder={t('Ваш email')}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm uppercase tracking-widest mb-2 dark:text-neutral-300">
                      {t('Задача')}
                    </label>
                    <textarea
                      id="message"
                      rows={2}
                      value={formData.message}
                      onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-white dark:border-neutral-600 py-2 px-0 focus:outline-none focus:border-black dark:focus:border-white placeholder-white/50 dark:placeholder-neutral-500 dark:text-white resize-none"
                      placeholder={t('Опишите вашу задачу — что нужно смоделировать и напечатать?')}
                      required
                    ></textarea>
                  </div>
                  {status === 'error' && (
                    <p className="text-white/80 dark:text-brand text-sm">{t('Ошибка отправки. Попробуйте ещё раз.')}</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="mt-8 px-8 py-3 bg-pink text-white text-sm uppercase tracking-widest hover:opacity-85 transition-opacity disabled:opacity-50 rounded-xl"
                  >
                    {status === 'loading' ? t('Отправляем...') : t('Отправить заявку')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      {(() => {
        const partners = [
          {
            name: 'Крымский ТЮЗ',
            logo: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/85b9dcef-4348-46d7-9de5-e6631e5f05d7.jpg',
          },
          {
            name: 'Греки Крыма «Таврида»',
            logo: 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/100cc5b8-14b2-4335-a06e-3cdcef6ebdde.jpg',
          },
          // { name: 'Название партнёра', logo: 'URL логотипа' },
        ];
        return (
          <section className="py-12 md:py-16 px-4 md:px-8 bg-white dark:bg-neutral-950 transition-colors duration-300">
            <div className="container mx-auto text-center">
              <p className="text-sm uppercase tracking-widest text-neutral-400 mb-10">{t('Нам доверяют')}</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-14">
                {partners.map(p => (
                  <div key={p.name} className="flex flex-col items-center gap-3 group">
                    <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center rounded-2xl bg-neutral-50 dark:bg-white p-3 transition-all group-hover:shadow-lg">
                      <img src={p.logo} alt={t(p.name)} className="w-full h-full object-contain" />
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{t(p.name)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 bg-black dark:bg-neutral-900 text-white transition-colors duration-300">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-400">{t('© 2025 FORM3D Studio. Все права защищены.')}</p>
          <img
            src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/1d7ecc4d-7ab1-4fae-8b3e-4fff27705d77.jpg"
            alt="Фамильный герб"
            className="w-14 h-14 object-contain opacity-70 hover:opacity-100 transition-opacity"
            style={{ filter: 'invert(1) brightness(2)' }}
          />
          <a href="/terms" className="text-sm text-neutral-400 hover:text-white transition-colors underline underline-offset-2">
            {t('Пользовательское соглашение')}
          </a>
        </div>
      </footer>
    </main>
  )
}