$(document).on('click touchstart', '.makeOrder', function(e) {
    if (document.getElementById("loggedIn") == null) {
        $('#loginModal').modal('show');
    } else {
        var itemName = $('.purchaseItemName').html();
        var itemNo = $('.purchaseItemNo').html();
        var itemPrice = $('.item_price').html().replace(/\D/g,'');
        var itemTotalPrice = itemPrice * itemNo;
        $('.purchaseListItem').html(itemName);
        $('.purchaseListQty').html(itemNo);
        $('.purchaseListPrice').html(itemTotalPrice);
        $('#confirmModal').modal('show');
    }
    var bizId = getUrlParams('bizId');
    var prodId = getUrlParams('prodId');
})
