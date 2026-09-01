import { useEffect } from 'react'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import LandingContent from '../components/LandingContent'
import Footer from '../components/Footer'


function Home() {

  // HASH SCROLLING:
  // When the URL contains something like:
  // #how-it-works or #for-restaurants
  // automatically scroll to that section after the Home page loads.
  useEffect(() => {

    const scrollToSection = () => {

      const sectionId = window.location.hash.replace('#', '')

      if (!sectionId) return


      // Small delay gives React enough time to render LandingContent
      setTimeout(() => {

        const section = document.getElementById(sectionId)

        if (section) {
          section.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }

      }, 100)

    }


    // Run when Home first loads
    scrollToSection()


    // Also works if the user clicks another hash link
    // while already on the Home page.
    window.addEventListener('hashchange', scrollToSection)


    return () => {
      window.removeEventListener('hashchange', scrollToSection)
    }

  }, [])


  return (
    <>

      {/* Shared navigation */}
      <Navbar />


      {/* Landing page hero */}
      <Hero />


      {/* Contains How It Works, For Restaurants and other homepage sections */}
      <LandingContent />


      {/* Shared footer */}
      <Footer />

    </>
  )
}


export default Home