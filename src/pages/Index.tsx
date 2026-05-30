import { useState } from 'react';

export default function Index() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
          <a href="/" className="text-xl font-bold tracking-tighter">
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
                src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/files/4e1e5b1f-9905-4348-a729-a8b644892a62.jpg"
                alt="3D печать"
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="py-20 px-4 md:px-8 bg-black text-white">
        <div className="container mx-auto">
          <h2 className="text-6xl font-bold tracking-tighter mb-12">РАБОТЫ</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="group">
              <div className="aspect-square bg-white mb-4 overflow-hidden">
                <img
                  src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/40b43bf2-12cd-4acb-8467-ff9875238471.jpg"
                  alt="Архитектурный макет"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Архитектурный макет</h3>
              <p className="text-neutral-400">Детализированная модель жилого комплекса в масштабе 1:200</p>
            </div>

            {/* Project 2 */}
            <div className="group">
              <div className="aspect-square bg-white mb-4 overflow-hidden">
                <img
                  src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/5f95621c-bb20-45af-b282-0d46117faf0c.jpg"
                  alt="Промышленный прототип"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Промышленный прототип</h3>
              <p className="text-neutral-400">Прецизионная деталь для машиностроительного производства</p>
            </div>

            {/* Project 3 */}
            <div className="group">
              <div className="aspect-square bg-white mb-4 overflow-hidden">
                <img
                  src="https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/bce5e7f0-9524-4efc-8ea3-8b7413a2af40.jpg"
                  alt="Дизайнерский объект"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Дизайнерский объект</h3>
              <p className="text-neutral-400">Авторская скульптурная форма для интерьера</p>
            </div>
          </div>
        </div>
      </section>

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
                Наш процесс включает полный цикл: от разработки 3D-модели по вашим эскизам или техническому заданию — до готового напечатанного изделия. Работаем с пластиком, смолой и нейлоном.
              </p>
              <p className="mb-6">
                Подходим для архитекторов, инженеров, дизайнеров, производств и всех, кому нужен качественный физический прототип или уникальный объект.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-12">
                <div>
                  <h3 className="text-sm uppercase tracking-widest mb-2">Принципы</h3>
                  <ul className="space-y-2">
                    <li>Точность деталей</li>
                    <li>Быстрые сроки</li>
                    <li>Любая сложность</li>
                    <li>Полный цикл</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-widest mb-2">Услуги</h3>
                  <ul className="space-y-2">
                    <li>3D-моделирование</li>
                    <li>3D-печать</li>
                    <li>Прототипирование</li>
                    <li>Постобработка</li>
                  </ul>
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