var app = {};
(function($) {

  app.access_token = window.localStorage.getItem('access_token');
  app.user_id = window.localStorage.getItem('user_id');

  $(function() {
    $('form.local-login').on('submit', function() {

      var email = $('#email').val();
      var password = $('#password').val();

      $.ajax({
        type:'POST',
        url:'/api/users/login',
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        data: JSON.stringify({email:email, password: password}),
        success: function(result) {
          window.localStorage.setItem('access_token', result.id);
          window.localStorage.setItem('user_id', result.userId);
          window.location = '/welcome';
        },
        error: function(err) {
          if(err.responseJSON && err.responseJSON.error) {
            //alert(err.responseJSON.error.message);
            $('.main-error-block').html(err.responseJSON.error.message);
            $('.main-error-block').show();
          }
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('user_id');
        }
      });

      return false;
    });
  });

})($);
