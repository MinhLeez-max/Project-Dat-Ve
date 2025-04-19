// Chức năng liên quan đến đặt vé

document.addEventListener('DOMContentLoaded', function() {
  // Chọn ghế
  const seatMap = document.querySelector('.seat-map');
  const selectedSeatsInput = document.getElementById('selectedSeats');
  const selectedSeatsDisplay = document.getElementById('selectedSeatsDisplay');
  const totalAmountDisplay = document.getElementById('totalAmount');
  const pricePerSeat = document.getElementById('pricePerSeat');
  
  if (seatMap) {
    const seats = seatMap.querySelectorAll('.seat.available');
    let selectedSeats = [];
    
    seats.forEach(seat => {
      seat.addEventListener('click', function() {
        const seatNumber = this.getAttribute('data-seat');
        
        if (this.classList.contains('selected')) {
          // Bỏ chọn ghế
          this.classList.remove('selected');
          selectedSeats = selectedSeats.filter(s => s !== seatNumber);
        } else {
          // Chọn ghế
          this.classList.add('selected');
          selectedSeats.push(seatNumber);
        }
        
        // Cập nhật danh sách ghế đã chọn và hiển thị
        selectedSeatsInput.value = selectedSeats.join(',');
        selectedSeatsDisplay.textContent = selectedSeats.join(', ') || 'Không có';
        
        // Cập nhật tổng số tiền
        if (pricePerSeat && totalAmountDisplay) {
          const price = parseFloat(pricePerSeat.value);
          const total = price * selectedSeats.length;
          totalAmountDisplay.textContent = `${total.toFixed(2)} VND`;
        }
        
        // Bật/tắt nút tiếp tục
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
          continueBtn.disabled = selectedSeats.length === 0;
        }
      });
    });
  }
  
  // Form thông tin hành khách
  const passengerDetailsForm = document.getElementById('passengerDetailsForm');
  
  if (passengerDetailsForm) {
    const addPassengerInputs = (numPassengers) => {
      const passengerContainer = document.getElementById('passengerContainer');
      passengerContainer.innerHTML = '';
      
      for (let i = 0; i < numPassengers; i++) {
        const div = document.createElement('div');
        div.className = 'mb-4 p-3 border rounded';
        div.innerHTML = `
          <h5>Hành Khách ${i + 1} - Ghế ${selectedSeatsArray[i]}</h5>
          <div class="mb-3">
            <label for="passengerName${i}" class="form-label">Họ và Tên</label>
            <input type="text" class="form-control" id="passengerName${i}" name="passengerName" required>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="passengerAge${i}" class="form-label">Tuổi</label>
              <input type="number" class="form-control" id="passengerAge${i}" name="passengerAge" min="1" max="120" required>
            </div>
            <div class="col-md-6 mb-3">
              <label for="passengerGender${i}" class="form-label">Giới Tính</label>
              <select class="form-select" id="passengerGender${i}" name="passengerGender" required>
                <option value="">Chọn Giới Tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>
        `;
        passengerContainer.appendChild(div);
      }
    };
    
    const selectedSeatsElement = document.getElementById('selectedSeatsInput');
    
    if (selectedSeatsElement) {
      const selectedSeatsArray = selectedSeatsElement.value.split(',');
      addPassengerInputs(selectedSeatsArray.length);
    }
  }
  
  // Form thanh toán
  const paymentForm = document.getElementById('paymentForm');
  
  if (paymentForm) {
    const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
    const paymentDetailsContainers = document.querySelectorAll('.payment-details');
    
    paymentMethodInputs.forEach(input => {
      input.addEventListener('change', function() {
        // Ẩn tất cả các chi tiết phương thức thanh toán
        paymentDetailsContainers.forEach(container => {
          container.classList.add('d-none');
        });
        
        // Hiển thị chi tiết phương thức thanh toán đã chọn
        const selectedMethod = this.value;
        const selectedContainer = document.getElementById(`${selectedMethod}Details`);
        
        if (selectedContainer) {
          selectedContainer.classList.remove('d-none');
        }
      });
    });
  }
});