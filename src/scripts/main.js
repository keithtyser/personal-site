document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('darkModeToggle');

  if (toggleButton) {
    // Function to toggle dark mode
    const toggleDarkMode = () => {
      document.documentElement.classList.toggle('dark');
      
      // Optional: Store preference in localStorage
      if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.removeItem('theme');
      }
    };

    // Add click event listener
    toggleButton.addEventListener('click', toggleDarkMode);

    // Check for saved theme preference on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } // No need for 'else' as default is light

  } else {
    console.warn('Dark mode toggle button with ID "darkModeToggle" not found.');
  }

  // --- Other potential JS code can be added below --- 

}); 