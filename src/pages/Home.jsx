function Home() {
  return (
    <div>
      <h1>牧場物語 雙子村 攻略網站</h1>
      <div className="mt-4 flex gap-4">
        <div className="bg-bluebell h-16 w-32 rounded text-white grid place-items-center">
          bluebell
        </div>
        <div className="bg-konohana h-16 w-32 rounded text-white grid place-items-center">
          konohana
        </div>
        <div className="bg-parchment border-ink h-16 w-32 rounded border-2 grid place-items-center">
          parchment
        </div>
        <div className="bg-ink h-16 w-32 rounded text-white grid place-items-center">
          ink
        </div>
      </div>
    </div>
  )
}

export default Home
