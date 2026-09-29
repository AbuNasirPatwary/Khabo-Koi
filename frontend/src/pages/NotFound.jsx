import { Link } from 'react-router-dom'


function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl shadow-orange-100/50 sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-600">404 · Page not found</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">This table is not available.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-500">
          The address may be incorrect, or the page may have moved. Return home and continue exploring Khabo-Koi.
        </p>
        <Link to="/" className="mt-8 inline-flex rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200">
          Back to home
        </Link>
      </section>
    </main>
  )
}


export default NotFound
