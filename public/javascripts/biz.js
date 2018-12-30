var countries;

$(document).ready(function(e) {
    $('#cartIcon').attr('href', '/shoppingcart/biz=' + $('#activeBiz').attr('bizId'))
})

function autocomplete(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) {
            return false;
        }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}

function checkPrds() {
    var inputVal = $('.bizProdSearch').val()
    var searchList = [];
    if (inputVal.length >= 3) {
        $.getJSON("/search?q=" + inputVal.toLowerCase() + '&biz=' + $('#activeBiz').attr("bizId")).success(function(data) {
            var searchList = [];
            var searchArray = data;
            searchArray.forEach(function(product) {
                searchList.push(product.product_name)
            });
            console.log(searchList)
            countries = searchList;
        }).then(function() {
            autocomplete(document.getElementById("myInput"), countries);
        });
    }
}

function addProdCat() {
    var inputVal = $(".prodCatInput").val();
    if (inputVal.length <= 2) {
        M.toast({
            html: "Characters should be more than 3"
        })
    } else {
        var obj = {
            name: inputVal,
            biz: $("#getBizId").text()
        };
        $.ajax({
            url: "/prodcategory/create",
            type: "POST",
            data: JSON.stringify(obj),
            contentType: "application/json",
            success: function(data) {
                $.getJSON("/prodCategory?q=" + $("#getBizId").text()).success(function(data) {
                    $(".populateBizCategory").html("");
                    for (var i = 0; i < data.length; i++) {
                        var id = data[i]._id;
                        var name = data[i].name
                        $(".populateBizCategory").append('<div class="chip" id="categoryChip-' + id + '">' + name + '<span class="closebtn deletePrdCat" id="' + id + '" style="cursor: pointer;">×</span></div>')
                    }
                });
            },
            error: function(xhr, text, err) {
                console.log('error: ', err);
                console.log('text: ', text);
                console.log('xhr: ', xhr);
                console.log("there is a problem whit your request, please check ajax request");
            }
        });
    }
}

$(document).on("click touchstart", ".deletePrdCat", function(e) {
    var deletePrdCat = $(this).attr('id');

    $.ajax({
        url: "/prodcategory/" + deletePrdCat + "/delete",
        type: 'POST',
        contentType: "application/json",
        success: function(data) {
            $('#categoryChip-' + deletePrdCat).remove();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
            console.log(XMLHttpRequest)
        }
    });
})

//Cart Modal Content
$(document).on('click', '.addToCart', function(e) {
    var cardContent = $(this).parent().parent().parent()
    var img = cardContent.find('img')[0].currentSrc
    var productName = cardContent.find('.productName')[0].innerHTML
    var productPrice = cardContent.find('.productPrice')[0].innerHTML
    var productId = cardContent[0].id

    if ($("#active-user").text() == "none") {
        $('#loginModal').modal('open')
    } else { //Add List of Products to Cart
        var obj = {
            prodName: productId,
            user: $("#active-user").text(),
            business: $("#activeBiz").attr('bizId'),
            quantity: "1"
        };
        $.ajax({
            url: "/shoppingcart/create",
            type: "POST",
            data: JSON.stringify(obj),
            contentType: "application/json",
            success: function(data) {
                M.toast({
                    html: "Added to cart successfully!"
                });
                $('.cartList').append('<div class="row" style="background: #eaeaea; padding: 10px 0px; border-radius: 3px;"> <div class="col s3"><img src=' + img + ' style="width: 60px; height: 60px; border-radius: 50%;"></div><div class="col s6"><p style="margin:0px;">' + productName + '</p><p style="margin:0px;">Ksh. ' + productPrice + '</p></div><div class="col s3"><div><button class="btn" style="line-height: 1; font-size: 0.7em;">remove</button></div></div></div>')
            },
            error: function(xhr, text, err) {
                M.toast({
                    html: "Error adding to cart!"
                });
                console.log('xhr: ', xhr);
                if (xhr.responseText == 'addedSuccessfully') {
                    M.toast({
                        html: "Added to cart successfully!"
                    });
                }
            }
        });
    }
});
