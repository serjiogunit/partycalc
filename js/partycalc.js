$(function () {
    var $partyTable = $('#party');
    $partyTable.delegate('.remove-product', 'click', function () {
        var colnum = $(this).closest('td').prevAll('td').length;

        $(this).closest('table').find('tr').find('td:eq(' + colnum + ')').remove();
    });

    $partyTable.delegate('.remove-user', 'click', function () {
        $(this).closest('tr').remove();
    });

    $('#add_user_btn').on('click', function () {
        var rowHtml = '<tr><td><input type="text" class="form-control" value=""></td>';
        for (var i = 0; i < $('td.product').length; i++) {
            rowHtml += '<td class="check"><input type="checkbox"></td>';
        }
        rowHtml += '<td><span></span></td> \
                    <td><input type="text" class="form-control"></td> \
                    <td><span></span></td> \
                    <td> \
                        <button type="button" class="remove-user btn btn-danger">х</button> \
                    </td></tr>';
        $partyTable.find('tbody').append(rowHtml);
    });

    $('#add_product_btn').on('click', function () {
        var columnHeadHtml = '<td class="product"><input type="text" class="form-control" value=""> \
                        <input type="text" class="form-control"> \
                        <button type="button" class="remove-product btn btn-danger">х</button> \
                    </td>';

        $partyTable.find('thead tr td.product:last').after(columnHeadHtml);

        for (var i = 0; i < $partyTable.find('tbody tr').length; i++) {
            var $row = $partyTable.find('tbody tr').eq(i);
            $row.find('td.check:last').after('<td class="check"><input type="checkbox"></td>');
        }
    });

    $('#calc_btn').on('click', function () {
        var products = {},
            users = {},
            $products = $('td.product'),
            $users = $partyTable.find('tbody tr');

        for (var i = 0; i < $products.length; i++) {
            products[i] = {
                name: $products.eq(i).find('input:first').val(),
                cost: $products.eq(i).find('input:last').val(),
                uses: 0
            };
        }
        for (i = 0; i < $users.length; i++) {
            var user_products = {};
            for (var j = 0; j < $products.length; j++) {
                user_products[j] = false;
                if ($users.eq(i).find('td.check').eq(j).find('input').prop('checked')) {
                    user_products[j] = true;
                    products[j].uses += 1;
                }
            }
            var paid = $users.eq(i).find('td').eq(2 + $products.length).find('input').val();
            if (!paid) {
                paid = 0;
            }
            users[i] = {
                name: $users.eq(i).find('td').eq(0).find('input').val(),
                paid: paid,
                products: user_products,
                must_pay: 0,
                to: {},
                from: {},
                processed: false
            };
        }
        $.each(users, function (user_id, user) {
            $.each(products, function (product_id, product) {
                if (user.products[product_id] && product.uses > 0) {
                    user.must_pay += product.cost / product.uses;
                }
            });

            user.total = user.must_pay - user.paid;
            user.total_changed = user.total;
            if (user.total == 0) {
                user.processed = true;
            }

            // must pay value
            $users.eq(user_id).find('td').eq(1 + $products.length).find('span').text(round2digit(user.must_pay));
            if (user.total > 0) {
                $users.eq(user_id).find('td').eq(3 + $products.length).find('span').text('отдать ' + round2digit(user.total));
            } else {
                $users.eq(user_id).find('td').eq(3 + $products.length).find('span').text('получить ' + Math.abs(round2digit(user.total)));
            }
        });

        var resHtml = '';

        // process users with equals total value to easy money exchange
        $.each(users, function (user_id, user) {
            if (!user.processed) {
                $.each(users, function (user_inner_id, user_inner) {
                    if (!user.processed && user_id != user_inner_id && !user_inner.processed) {
                        if (user.total + user_inner.total == 0) {
                            if (user.total > 0) {
                                user.to[user_inner_id] = user.total;
                                user_inner.from[user] = user.total;
                                user.processed = true;
                                user_inner.processed = true;

                                resHtml += 'Участник <strong>' + user.name + '</strong> должен отдать участнику <strong>' + user_inner.name + '</strong> ' + round2digit(user.total) + '<br>';
                            } else {
                                user.from[user_inner_id] = user.total;
                                user_inner.to[user] = user.total;
                                user.processed = true;
                                user_inner.processed = true;

                                resHtml += 'Участник <strong>' + user_inner.name + '</strong> должен отдать участнику <strong>' + user.name + '</strong> ' + round2digit(user.total) + '<br>';
                            }
                        }
                    }
                });
            }
        });

        // process another users
        $.each(users, function (user_id, user) {
            if (!user.processed) {
                $.each(users, function (user_inner_id, user_inner) {
                    if (!user.processed && user_id != user_inner_id && !user_inner.processed && user.total_changed * user_inner.total_changed < 0) {
                        if (user.total_changed > 0) {
                            if (user.total_changed > Math.abs(user_inner.total_changed)) {
                                user.to[user_inner_id] = user_inner.total_changed;
                                user.total_changed -= Math.abs(user_inner.total_changed);
                                user_inner.from[user_id] = Math.abs(user_inner.total_changed);
                                user_inner.total_changed = 0;
                                user_inner.processed = true;

                                resHtml += 'Участник <strong>' + user.name + '</strong> должен отдать участнику <strong>' + user_inner.name + '</strong> ' + round2digit(user_inner.from[user_id]) + '<br>';
                            } else {
                                user.to[user_inner_id] = user.total_changed;
                                user_inner.total_changed += user.total_changed;
                                user_inner.from[user_id] = user.total_changed;
                                user.total_changed = 0;
                                user.processed = true;

                                resHtml += 'Участник <strong>' + user.name + '</strong> должен отдать участнику <strong>' + user_inner.name + '</strong> ' + round2digit(user_inner.from[user_id]) + '<br>';
                            }
                        } else {
                            if (user_inner.total_changed > Math.abs(user.total_changed)) {
                                user_inner.to[user_id] = user.total_changed;
                                user_inner.total_changed -= Math.abs(user.total_changed);
                                user.from[user_inner_id] = Math.abs(user.total_changed);
                                user.total_changed = 0;
                                user.processed = true;

                                resHtml += 'Участник <strong>' + user_inner.name + '</strong> должен отдать участнику <strong>' + user.name + '</strong> ' + round2digit(user.from[user_inner_id]) + '<br>';
                            } else {
                                user_inner.to[user_id] = user_inner.total_changed;
                                user.total_changed += user_inner.total_changed;
                                user.from[user_inner_id] = user_inner.total_changed;
                                user_inner.total_changed = 0;
                                user_inner.processed = true;

                                resHtml += 'Участник <strong>' + user_inner.name + '</strong> должен отдать участнику <strong>' + user.name + '</strong> ' + round2digit(user.from[user_inner_id]) + '<br>';
                            }
                        }
                    }
                });
            }
        });

        $('#result').show();

        $.each(products, function (product_id, product) {
            if (!product.uses) {
                resHtml = '<strong>Отметьте галочками кто что ел/пил</strong>';
            }
        });
        $('#result .panel-body').html(resHtml);
    });
});


function round2digit(value) {
    return Math.round(value * 100) / 100;
}