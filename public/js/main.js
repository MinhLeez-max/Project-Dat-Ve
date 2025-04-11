// Common functionality for all pages

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Close alert messages after 5 seconds
  const alertMessages = document.querySelectorAll('.alert:not(.alert-persistent)');
  if (alertMessages.length > 0) {
    setTimeout(() => {
      alertMessages.forEach(alert => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      });
    }, 8000);
  }
  
  // Form validation
  const forms = document.querySelectorAll('.needs-validation');
  
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
  
  // City search autocomplete
  const cityInputs = document.querySelectorAll('.city-autocomplete');
  
  if (cityInputs.length > 0) {
    fetch('/routes/cities')
      .then(response => response.json())
      .then(cities => {
        cityInputs.forEach(input => {
          input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const datalist = document.getElementById(this.getAttribute('list'));
            
            // Clear existing options
            while (datalist.firstChild) {
              datalist.removeChild(datalist.firstChild);
            }
            
            // Add filtered cities as options
            cities.filter(city => city.toLowerCase().includes(value))
              .forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                datalist.appendChild(option);
              });
          });
        });
      })
      .catch(error => console.error('Error loading cities:', error));
  }
  
  // Date picker configuration
  const datePickers = document.querySelectorAll('.datepicker');
  
  if (datePickers.length > 0) {
    datePickers.forEach(input => {
      // Set min date to today
      const today = new Date().toISOString().split('T')[0];
      input.setAttribute('min', today);
      
      // Set default date to today if empty
      if (!input.value) {
        input.value = today;
      }
    });
  }
});
