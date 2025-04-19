// Chức năng chung cho tất cả các trang

document.addEventListener('DOMContentLoaded', function() {
  // Khởi tạo Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Tự động đóng thông báo sau 8 giây
  const alertMessages = document.querySelectorAll('.alert:not(.alert-persistent)');
  if (alertMessages.length > 0) {
    setTimeout(() => {
      alertMessages.forEach(alert => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      });
    }, 8000);
  }
  
  // Xác thực biểu mẫu
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
  
  // Tự động hoàn thành tìm kiếm thành phố
  const cityInputs = document.querySelectorAll('.city-autocomplete');
  
  if (cityInputs.length > 0) {
    fetch('/routes/cities')
      .then(response => response.json())
      .then(cities => {
        cityInputs.forEach(input => {
          input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const datalist = document.getElementById(this.getAttribute('list'));
            
            // Xóa các tùy chọn hiện có
            while (datalist.firstChild) {
              datalist.removeChild(datalist.firstChild);
            }
            
            // Thêm các thành phố phù hợp làm tùy chọn
            cities.filter(city => city.toLowerCase().includes(value))
              .forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                datalist.appendChild(option);
              });
          });
        });
      })
      .catch(error => console.error('Lỗi khi tải danh sách thành phố:', error));
  }
  
  // Cấu hình bộ chọn ngày (Date Picker)
  const datePickers = document.querySelectorAll('.datepicker');
  
  if (datePickers.length > 0) {
    datePickers.forEach(input => {
      // Đặt ngày tối thiểu là ngày hôm nay
      const today = new Date().toISOString().split('T')[0];
      input.setAttribute('min', today);
      
      // Đặt ngày mặc định là hôm nay nếu trống
      if (!input.value) {
        input.value = today;
      }
    });
  }
});