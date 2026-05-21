var isMobileDevice = (/Android|webOS|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|mobile/i).test(top.navigator.userAgent);
$(document).ready(function () {
    updateModelsEllipsis();
    SpotResize();
    setTimeout(SpotResize, 500);
    setTimeout(SpotResize, 1000);
    searchCategories();
    openModalModels();
    openSort();
    openLang();
    searchCountry();
    scrollTop();
    initPlayTrailerOnHover();
    initPlayTrailerOnSwipe();
    initShowAllTags();
    initHeaderFixed();
    initAutocomplete();
    ititThemes();
    initFavourites();
    // initShowBaner();

    $('body').on('click', '.header-close', function(){
        $('.navigation').removeClass('open');
        return false;
    });

    $('body').on('click', '.header-burger', function(){
        $('.navigation').addClass('open');
        $('.drop_lang img').each(function() {
            $(this).attr('src',$(this).attr('data-src'));
        });
        return false;
    });

    $('body').on('click', '.js-related-toggle-button', function(){
        if ($('.player-slider').hasClass('show')) {
            $('.player-slider').removeClass('show');
            $('.player-slider').hide();
        } else {
            $('.player-slider').show();
            $('.player-slider').addClass('show');
        }
        return false;
    });

    $('#file-upload').change(function(e){
        var size = this.files[0].size;
        var time = 0;
        if(size>1027957940) {
            time = 240;
        } else if (size>102795000) {
            time = 120;
        } else {
            time = 60;
        }
        var style = 'all '+time+'s';
        $('.upload-bar').css({'transition' : style});

        setTimeout(function(){
            $('.upload-bar').addClass('progress');
        }, 700);

        setTimeout(function(){
            $('.btn-accent').removeAttr("disabled")
        }, time*1000);

        $(this).closest('form').find('.submit').click();
    });

    $('body').on('click', '.js-upload', function(){
        var $error = false;
        var $title = $('#edit_video_title').val();
        if ($title == '') {
            $('#edit_video_title').closest('.row').find('.field-error').addClass('show');
            $error = true;
        }

        var count = 0;
        $('.upload_categories').find('input:checkbox').each(function() {
            if ($(this).is(":checked")) {
                count++;
            }
        });

        if (count<3 || count>10) {
            $('.upload_categories').closest('.row').find('.field-error').addClass('show');
            $error = true;
        }

        if ($error==false) {
            $('.form__wrapper .row').addClass('hidden');
            $('.form__wrapper .bottom').addClass('hidden');
            $('.form-upload1').addClass('hidden');
            $('.form__wrapper .success').removeClass('hidden');
        }
        return false;
    });

    $('body').on('click', '.upload_categories', function(){
        $('.upload_categories').closest('.row').find('.field-error').removeClass('show');
    })

    $("#edit_video_title").keyup(function (e) {
        $('#edit_video_title').closest('.row').find('.field-error').removeClass('show');
    });

    $('body').on('click', '.js-filter-categories', function(){
        var $list = $(this).closest('.list');
        var $url = $list.attr('data-url');
        var arr = [];

        setTimeout(function(){
            $list.find('input:checkbox').each(function() {
                if ($(this).is(":checked")) {
                    var $id = $(this).attr('data-value');
                    arr.push($id);
                }
            });
            $url = $url + "all," + arr;
            window.location.href = $url;
        }, 100);
    });

    var date = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = "kt_rt_lang2=true222; path=/; expires=" + date.toUTCString();

    // var $height = +$('.related-videos').height() + 40 + 'px';
    // $('.related-videos').css('height', $height);

    $('body').on('click', '#load-related', function(){
        let $this = $(this);
        let video_id = $this.attr('data-video-id');
        let count = $this.attr('data-count');
        let offset = +$this.attr('data-offset');

        if (offset >= 48) {
            return false;
        }

        $.ajax({
            url: '/get_related_videos.php?id='+video_id+'&count=' + count + '&offset=' + offset,
            success: function (data) {
                $('#list_videos_related_videos_items').append(data);
                let new_offset = +offset + +count;
                $this.attr('data-offset', new_offset);
                if (new_offset >= 48) {
                    // hide load-related
                    $this.hide();
                }
            }
        })

        return false;
    })
});

function updateModelsEllipsis() {
    $('.item .models').each(function () {
        var $el = $(this);

        $el.removeClass('is-truncated');

        if (this.scrollWidth > this.clientWidth) {
            $el.addClass('is-truncated');
        }
    });
}

$(window).on('resize', function () {
    updateModelsEllipsis();
});

function searchCategories() {
    $(".js-search-categories").keyup(function (e) {
        clearTimeout($.data(this, 'timer'));
        if (e.keyCode == 13) {
            search(true);
        } else
            $(this).data('timer', setTimeout(search, 500));
    });

    function search(force) {
        var $this = $(".js-search-categories");
        var existingString = $this.val();
        var $id = $this.attr('data-id');

        if (existingString.length < 1) {
            $("[data-categories]").show();
            $('.search-thumb').html('');
            return
        }

        if (!force && existingString.length < 3) return;

        $.ajax({
            url: '/categories_videos.php?mode=async&function=get_block&block_id=' + $id + '&q=' + existingString,
            success: function (data) {
                $("[data-categories]").hide();
                $('.search-thumb').html(data);
            }
        })
    }
}

function openModalModels() {
    $('body').on('click', '.js-modal', function(){
        var $this = $(this);
        if ($this.closest('#download-modal').hasClass('open')) {
            $this.closest('#download-modal').removeClass('open');
        } else {
            $this.closest('#download-modal').addClass('open');
        }
        return false;
    });

    $('body').on('click', function(e) {
        if ($(e.target).closest(".modal-wrapper").length) return
        if (!$(e.target).closest(".modal-wrapper").length) {
            $('body').find(".modal").removeClass("open");
        }
    });
}

function openSort(){
    $('body').on('click', '.sort', function(e){
        if ($(e.target).closest(".js-search-country").length) return
        var $this = $(this);
        if ($this.hasClass('sort--open')) {
            $this.removeClass('sort--open');
        } else {
            $('.sort').removeClass('sort--open');
            $this.addClass('sort--open');
        }
    });

    $('body').on('click', function(e) {
        if ($(e.target).closest(".sort").length) return
        if ($(e.target).closest(".js-search-country").length) return
        if (!$(e.target).closest(".sort").length) {
            $(".sort").removeClass("sort--open");
        }
    });
}

function openLang(){
    $('body').on('click', '.js-open-lang', function(){
        var $block = $(this).closest('.lang-holder');
        if ($block.hasClass('open')) {
            $block.removeClass('open');
        } else {
            $block.addClass('open');
        }
        return false;
    });

    $('body').on('click', function(e) {
        if ($(e.target).closest(".lang-holder").length) return
        if (!$(e.target).closest(".lang-holder").length) {
            $(".lang-holder").removeClass("open");
        }
    });
}

$(window).resize(function() {
    initShowAllTags();
});


function initShowAllTags(){
    var links = $('.hidden_tags a');
    var $height_main = $('.hidden_tags').height();
    $(links.get().reverse()).each(function(index) {
        var $height = $('.hidden_tags .item').height();
        var currentLink = $(this);
        if ($height>$height_main) {
            if (currentLink.hasClass('js-show-tags')) {
                currentLink.show();
            } else {
                currentLink.addClass('hidden');
            }
        }
    });

    $('body').on('click', '.js-show-tags', function(){
        var $this = $(this);
        var $block = $this.closest('.hidden_tags');
        if ($block.hasClass('show')) {
            $block.removeClass('show');
            $this.html('+');
        } else {
            $block.addClass('show');
            $this.html('-');
        }
        return false;
    });
}

function searchCountry(){
    $('.js-search-country').on('input', function() {
        var value = $(this).val().toLowerCase();
        var counter = 0;
        $('[data-country] > a').each(function(i, el) {
            if ($(el).text().toLowerCase().indexOf(value) == 0) {
                $(el).removeClass('hidden');
            } else {
                $(el).addClass('hidden');
            }
        })

        if (counter == 0) {
            console.log('not found');
        }
    });
}

function scrollTop() {
    $('#scrollUp').click(function(){
        $("html, body").animate({ scrollTop: 0 }, 600);
        return false;
    });
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function delete_cookie(name) {
    document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


function initPlayTrailerOnHover() {
    var timeout;
    var interval;
    $('body').on('mouseenter', '[data-preview]', function() {
        var $this = $(this);
        var $video = $this.find('video');
        var $image = $this.find('img');
        if ($video.length) {
            $video.get(0).play();
            $image.hide();
        } else {
            var $loader = $('<div class="preview-progress"></div>');
            $this.append($loader);
            setTimeout(function() {
                $loader.addClass('full');
            });

            timeout = setTimeout(function() { //avoid downloading video with quick hover
                var video_url = $this.attr('data-preview');
                var $new_video = $('<video loop autoplay muted playsinline src="' + video_url + '">');

                interval = setInterval(function() { //wait and play once loaded
                    if ($new_video.get(0).readyState > 0) {
                        $this.append($new_video);
                        $new_video.get(0).play();
                        $image.hide();
                        $loader.remove();
                        $this.addClass('preview-play');
                        clearInterval(interval);
                    }
                }, 1);
            }, 1);
        }

    }).on('mouseleave', '[data-preview]', function() {
        clearTimeout(timeout);
        clearInterval(interval);
        var $this = $(this);
        var $video = $this.find('video');
        if ($video.length) {
            $video.remove();
        }
        $this.removeClass('preview-play');
        $this.find('img').show();
        $this.find('.preview-progress').remove();
    });
}

function initPlayTrailerOnSwipe() {
    if(!getCookie('swipe-preview') && isMobileDevice) {
        $('[data-preview]').eq(0).append('<div class="img__swipe"></div>');
    }

    var interval;

    $(window).on('scroll', function() {
        if ($(window).width() <= 440) {
            var scrollTop = $(window).scrollTop();
            var windowHeight = $(window).height();
            var currentEls = $(".item.thumb");
            var timeout1;
            var timeout2;
            var interval;
            var count = 0;
            var currentCount;
            function trailerPlay(el, currentCount) {
                var $this = el;
                var $video = $this.find('video');
                var $image = $this.find('img');
                var $image_holder = $this.find('.thumb__img');
                if ($video.length || currentCount != 1 || el.hasClass('done')) {
                    // console.log($video.length)
                } else {
                    timeout1 = setTimeout(function() {
                        var video_url = $image_holder.attr('data-preview');
                        // console.log(video_url)
                        var $new_video = $('<video autoplay loop muted playsinline src="' + video_url + '"></video>');
                        function playVideo() {
                            $this.find('.thumb__img').append($new_video);
                            $new_video.get(0).play();
                            $image.hide();
                            $this.find(".timeline").hide();
                            $this.addClass('preview-play');
                        }
                        timeout2 = setTimeout(function() {
                            if ($new_video.get(0).readyState > 0) {
                                playVideo();
                            } else {
                                interval = setInterval(function() {
                                    if ($new_video.get(0).readyState > 0) {
                                        playVideo();
                                        clearInterval(interval);
                                    }
                                }, 10);
                            }
                        }, 10);
                    }, 10);
                }
                currentCount++;
            }
            currentEls.each(function() {
                var el = $(this);
                var offset = el.offset();
                if (scrollTop <= offset.top && ((el.height() * 1.5) + offset.top) < (scrollTop + windowHeight)) {
                    if (!$('.thumbs-list .item').hasClass('done')) {
                        var currentCount = 1;
                        trailerPlay(el, currentCount)
                        el.addClass('done');
                        el.addClass('preview-play');
                    }
                }
                if (scrollTop >= (offset.top + (el.height() / 4))) {
                    el.find('video').remove();
                    el.removeClass('done');
                    el.removeClass('preview-play');
                    el.find('img').show();
                    el.find(".timeline").show();
                }
                if (scrollTop <= offset.top && ((el.height() / 4) + offset.top) > (scrollTop + windowHeight)) {
                    el.find('video').remove();
                    el.removeClass('done');
                    el.removeClass('preview-play');
                    el.find('img').show();
                    el.find(".timeline").show();
                }
            });
        }
        ;
    });

    $('body').on('touchstart', '[data-preview]', function() {
        if(!getCookie('swipe-preview')) {
            var date = new Date;
            date.setDate(date.getDate() + 365);
            document.cookie = "swipe-preview=1; path=/; expires=" + date.toUTCString();
            $('.img__swipe').remove();
        }

        var $this = $(this);
        var $video = $this.find('video');
        if ($video.length) {
            if ($video.get(0).paused == false) {
                $video.get(0).pause();
            } else {
                $video.get(0).play();
            }
        } else {
            $('[data-preview]').each(function () {
                var $this = $(this);
                var $video = $this.find('video');
                if ($video.length) {
                    $video.get(0).remove();
                }
                $this.find('.preview-progress').remove();
                $this.removeClass('preview-play');
            });

            var $loader = $('<div class="preview-progress"></div>');
            $this.append($loader);
            setTimeout(function() {
                $loader.addClass('full');
            }, 1);

            var video_url = $this.attr('data-preview');
            var $new_video = $('<video loop autoplay muted playsinline src="' + video_url + '">');

            function playVideo() {
                $this.append($new_video);
                $new_video.get(0).play();
                $loader.remove();
                $this.addClass('preview-play');
            }
            interval = setInterval(function() { //wait and play once loaded
                if ($new_video.get(0).readyState > 0) {
                    playVideo();
                    clearInterval(interval);
                }
            }, 1);
        }
    });
}

window.addEventListener("load", function () {
    var locale = window.location.origin.split('.')[0].split('//')[1];
    if ($.cookie('cookiesBanner') == null && locale.toLowerCase() != 'de' && locale.toLowerCase() != 'fr') {
        $('.cookiesBanner').removeClass('hidden')
    }


    $('.cookiesBanner .okButton').on('click', function () {
        $('.cookiesBanner').addClass('hidden')

        var domain = window.location.origin;
        var expires = new Date();
        expires.setTime(expires.getTime() + (1200 * 60 * 60 * 1000));
        document.cookie = 'cookiesBanner=true;expires=' + expires.toUTCString() + ';path=/';
    });

    $('.cookiesBanner .closeButton').on('click', function () {
        $('.cookiesBanner').addClass('hidden')
    });
});

function initHeaderFixed() {
    function handleOrientationChange() {
        if (window.orientation === 90 || window.orientation === -90) {
            $(".header").addClass('scroll');
        } else {
            $(".header").removeClass('scroll');
            $(".header").removeClass('top-fixed');
        }
    }

    handleOrientationChange();
    $(window).on("orientationchange", handleOrientationChange);

    var previousScroll = 0;
    $(window).scroll(function() {
        var header = $(".header.scroll");
        var currentScroll = $(this).scrollTop();
        if (currentScroll > previousScroll && currentScroll > 70) {
            header.css("top", "-150px");
        } else {
            header.css("top", "0");
        }
        if (previousScroll<300) {
            header.addClass('top-fixed');
        } else {
            header.removeClass('top-fixed');
        }

        previousScroll = currentScroll;
    });
}

function initAutocomplete() {
    $('.js-autocomplete').autocomplete({
        serviceUrl: '/search_suggestion.php',
        groupBy: 'content',
        deferRequestBy: 0,
        triggerSelectOnValidInput: false,
        minChars: 1,
        showNoSuggestionNotice: true,
        formatResult: function(suggestion, currentValue) {
            if (!currentValue) {
                return suggestion.value;
            }
            var pattern = '(' + currentValue.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&") + ')';
            var value = suggestion.value
            var value = suggestion.value
                .replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/&lt;(\/?strong)&gt;/g, '<$1>');
            var href = '';

            var urls = JSON.parse(pageContext.langUrls);
            switch (suggestion.data.content) {
                case 'categories':
                    href = urls['videos_by_category'].replace('%DIR%', suggestion.data.dir);
                    break;
                case 'pornstars':
                    href = urls['videos_by_model'].replace('%DIR%', suggestion.data.dir);
                    break;
                case 'tags':
                    href = urls['videos_by_tag'].replace('%DIR%', suggestion.data.dir);
                    break;
                case 'channels':
                    href = urls['videos_by_sponsor'].replace('%DIR%', suggestion.data.dir);
                    break;
                case 'search':
                    href = urls['search_query'].replace('%QUERY%', suggestion.data.dir);
                    break;
                default:
                    break;
            }
            return '<a href="' + href + '"class="autocomplete-box ' + suggestion.data.dir + '">' +
                // '<div class="autocomplete-icon"><i class="fa icon-' + suggestion.data.content + '"></i></div>' +
                '<div class="autocomplete-text">' + value + '</div>' +
                '<div class="autocomplete-quantity">' + suggestion.data.quantity + '</div>' +
            '</a>';
        },
        onSearchComplete: function() {
            $('.autocomplete-group:contains("hidden")').addClass('hidden-group');
        }
    });
}

function readCookieDelit(name) {
    var name_cook = name + "=";
    var spl = document.cookie.split(';');
    for(var i=0; i<spl.length; i++) {
        var c = spl[i];
        while (c.charAt(0)==' ') c = c.substring(1, c.length);
        if(c.indexOf(name_cook) == 0) return c.substring(name_cook.length, c.length);
    }
    return null;
}

function ititThemes() {
    var kt_rt_theme = readCookieDelit('kt_rt_theme');
    var imgElement = $('.footer-row .js-logo');
    if (kt_rt_theme == 'dark') {
        var dataLightValue = imgElement.attr('data-dark');
        $('#theme_color').attr('content','#202028');
        $('#theme_color1').attr('content','#202028');
    } else if (kt_rt_theme == 'light') {
        var dataLightValue = imgElement.attr('data-light');
        $('#theme_color').attr('content','#f6f8fa');
        $('#theme_color1').attr('content','#f6f8fa');
    } else {
        var dataLightValue = imgElement.attr('data-light');
        $('#theme_color').attr('content','#202028');
        $('#theme_color1').attr('content','#202028');
    }
    imgElement.attr('src', dataLightValue);

    $('.js-themes').on('click', function() {
        var $body = $('body');
        if ($body.hasClass('light')) {
            $body.removeClass('light');
            $body.addClass('dark');
            $('.js-logo').attr('src',$('.js-logo').attr('data-dark'));
            var date = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
            document.cookie = "kt_rt_theme=dark; path=/; expires=" + date.toUTCString();
            $('#theme_color').attr('content','#202028');
            $('#theme_color1').attr('content','#202028');
        } else {
            $body.addClass('light');
            $body.removeClass('dark');
            $('.js-logo').attr('src',$('.js-logo').attr('data-light'));
            var date = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
            document.cookie = "kt_rt_theme=light; path=/; expires=" + date.toUTCString();
            $('#theme_color').attr('content','#f6f8fa');
            $('#theme_color1').attr('content','#f6f8fa');
        }
        return false;
    });
}

function initShowBaner() {
    return false;
    interval1 = setInterval(function () {
        if ($('.asg-vjs-overlay').length > 0) {
            clearInterval(interval1);
            setTimeout(function () {
                var dataString  = localStorage.getItem('asgsl');
                var regex = /shows:(\d+)/g;
                var match = dataString.match(regex);
                if (match!==null) {
                    var valueString = +match[0].split(":")[1];
                    if (valueString>0) {
                        var $popup_show = true;
                    } else {
                        var $popup_show = false;
                    }
                    var kt_rt_popunder_player = readCookieDelit('kt_rt_popunder_player');
                    var interval;
                    if ($('.modal_banner').length > 0 && kt_rt_popunder_player===null && $popup_show==true) {
                        $('.player-wrap__wrap').append('<div class="open_block js-open-block"></div>');
                        interval = setInterval(function () {
                            if ($('.asg-vjs-overlay').length > 0) {
                                $('.asg-vjs-overlay').addClass('hidden_vast');
                                setTimeout(function () {
                                    clearInterval(interval);
                                }, 1000);
                            }
                        }, 10);
                    }
                }
            }, 1000);
        }
    }, 10);

    $('body').on('click', '.js-open-block', function(){
        $('.asg-vjs-overlay').removeClass('hidden_vast');
        var date = new Date(new Date().getTime() + 5 * 60 * 1000);
        document.cookie = "kt_rt_popunder_player=1; path=/; expires=" + date.toUTCString();
        if ($('#download-modal').hasClass('open')) {
            $('.open_block').hide();
            $('#download-modal').removeClass('open');
            player.play();
        } else {
            $('#download-modal').addClass('open');
        }

        return false;
    });
}

function SpotResize() {
    return false;
    var width = $('.related-video .item').width();
    $('.bottom-adv .spot').each(recountSpots);

    function recountSpots(index, elem) {
        var spot_height = $(elem).height();
        var spot_width = $(elem).width();
        var y = (width - 2) / spot_width;

        if (y < 1) {
            var mar_h = ((spot_height * y) - spot_height) / 2;
            var mar_w = ((spot_width * y) - spot_width) / 2 + 15;
            $(elem).css({
                transform: "scale(" + y + ")",
                "margin": "" + mar_h + "px 0 0 " + mar_w + "px",
                "right": mar_w + "px",
            });
        } else if (y > 1) {
            var mar_h = ((spot_height * y) - spot_height) / 2;
            $(elem).css({
                transform: "scale(" + y + ")",
                "margin": "" + mar_h + "px 0 0 0px",
                "right": mar_w + "px",
            });
        }

        var h_spot = spot_height * y;

        $(elem).closest('.bottom-adv').css({
            "height": "" + h_spot + "px"
        });
    }
};

$(window).on("resize", function () {
    SpotResize();
})

$(window).on("scroll", function () {
    SpotResize();
})

function adjustSitesList() {
    const $list = $('.sites__list');
    if (!$list.length) return;

    const $allBtn = $list.find('.sites__all');
    const $items = $list.find('.sites__item').not('.sites__all');

    if ($(window).width() <= 1279) {
        $items.show();
        return;
    }

    const containerWidth = $list.width();

    function getGap($visible) {
        let itemsWidth = 0;
        $visible.each(function () {
            itemsWidth += $(this).outerWidth(true);
        });
        const gaps = $visible.length > 1 ? $visible.length - 1 : 1;
        return (containerWidth - itemsWidth - $allBtn.outerWidth(true)) / gaps;
    }

    $items.show();

    let $visible = $items.filter(':visible');

    while ($visible.length > 1 && getGap($visible) < 8) {
        let $minEl = null;
        let minW = Infinity;

        $visible.each(function () {
            const w = $(this).outerWidth(true);
            if (w < minW) {
                minW = w;
                $minEl = $(this);
            }
        });

        if ($minEl) {
            $minEl.hide();
            $visible = $items.filter(':visible');
        } else {
            break;
        }
    }
}

$(window).on('load resize', adjustSitesList);

function initFavourites() {
    $(document).on('click', '.js-favourites', function () {
        var $this = $(this);
        var $action = $this.attr('data-action');
        var $type = $this.attr('data-type') || 'video';
        var $setup = [];
        var $timestamp = new Date().getTime();
        var $text_add = $('.favourites_header').attr('data-text_add');
        var $text_delet = $('.favourites_header').attr('data-text_delet');
        var $count_favourites = +$('.js-count-favourites').html();
        if ($type=='video') {
            $favourites_bd = 'favourites_videos';
            $object_id = $this.attr('data-object_id');
            if ($action=='add') {
                $.ajax({
                    url: '/ajax_view_video.php?id='+$object_id,
                    success: function (data) {
                        $setup = JSON.parse(data);
                        var user_data_db_v = localStorage.getItem('user_data_db_v');
                        if(user_data_db_v===null) {
                            user_data_db_v = 1;
                        }
                        var request = indexedDB.open('user_data_db', user_data_db_v);
                        request.onsuccess = function(event) {
                            var db = event.target.result;
                            var transaction = db.transaction([$favourites_bd], 'readwrite');
                            var store = transaction.objectStore($favourites_bd);

                            if ($action=='add') {
                                var request = store.get($object_id);
                                request.onerror = function(event) {
                                    console.error("Error reading data from IndexedDB:", event.target.errorCode);
                                };
                                request.onsuccess = function(event) {
                                    if ($type=='video') {
                                        $video_id = $setup['video_id'];
                                        var newVideoInfo = {
                                            video_id: $setup['video_id'],
                                            url: $setup['url'],
                                            title: $setup['title'],
                                            title2: $setup['title2'],
                                            duration: $setup['duration'],
                                            dir: $setup['dir'],
                                            screenshot: $setup['screenshot'],
                                            preview: $setup['preview'],
                                            models: $setup['models'],
                                            content_source: $setup['content_source'],
                                            timestamp: $timestamp,
                                            shemale: $setup['shemale'],
                                            k4: $setup['k4'],
                                            video_viewed: $setup['video_viewed'],
                                            object_rating: $setup['object_rating']
                                        };

                                        var updateRequest = store.put({
                                            video_id: $video_id,
                                            video: newVideoInfo
                                        });
                                    }
                                    updateRequest.onerror = function(event) {
                                        console.error("Error writing data to IndexedDB:", event.target.errorCode);
                                    };

                                    updateRequest.onsuccess = function(event) {
                                        if ($type=='video') {
                                            $('[data-type="' + $type + '"][data-object_id="' + $object_id + '"]').attr('data-action', 'delet');
                                        } else {
                                            $this.attr('data-action', 'delet');
                                        }
                                        db.close();
                                        console.log("Data successfully written to IndexedDB");
                                    };
                                };
                            } else {
                                user_data_db_v = +user_data_db_v + 0;
                                localStorage.setItem('user_data_db_v',user_data_db_v);
                                var deleteRequest = store.delete($object_id);
                                deleteRequest.onerror = function(event) {
                                    console.error("Error deleting data from IndexedDB:", event.target.errorCode);
                                };
                                deleteRequest.onsuccess = function(event) {
                                    if ($this.hasClass('js-favourites-thumb')) {
                                        $this.closest('.thumb-bl').hide();
                                    } else {
                                        if ($type=='video') {
                                            $('[data-type="' + $type + '"][data-object_id="' + $object_id + '"]').attr('data-action', 'add');
                                        } else {
                                            $this.attr('data-action', 'add');
                                        }
                                    }
                                    db.close();
                                };
                            }
                        };
                    }
                })
                $count_favourites++;
                $('#noty_layout__topRight').find('.noty_body').html($text_add);
            } else {
                var user_data_db_v = localStorage.getItem('user_data_db_v');
                if(user_data_db_v===null) {
                    user_data_db_v = 1;
                }
                var request = indexedDB.open('user_data_db', user_data_db_v);
                request.onsuccess = function(event) {
                    var db = event.target.result;
                    var transaction = db.transaction([$favourites_bd], 'readwrite');
                    var store = transaction.objectStore($favourites_bd);

                    user_data_db_v = +user_data_db_v + 0;
                    localStorage.setItem('user_data_db_v',user_data_db_v);
                    var deleteRequest = store.delete($object_id);
                    deleteRequest.onerror = function(event) {
                        console.error("Error deleting data from IndexedDB:", event.target.errorCode);
                    };
                    deleteRequest.onsuccess = function(event) {
                        if ($this.hasClass('js-favourites-thumb')) {
                            $this.closest('.thumb-bl').hide();
                        } else {
                            if ($type=='video') {
                                $('[data-type="' + $type + '"][data-object_id="' + $object_id + '"]').attr('data-action', 'add');
                            } else {
                                $this.attr('data-action', 'add');
                            }
                        }
                        db.close();
                    };
                };
                $count_favourites--;
                $('#noty_layout__topRight').find('.noty_body').html($text_delet)
            }

            $('#noty_layout__topRight').addClass('show videos_favourites');

            if ($count_favourites>0) {
                $('.js-count-favourites').html($count_favourites).show();
            } else {
                $('.js-count-favourites').html($count_favourites).hide();
            }
            setTimeout(function() {
                $('#noty_layout__topRight').removeClass('show');
                setTimeout(function () {
                    $('#noty_layout__topRight').removeClass('videos_favourites');
                }, 400);
            }, 2000);
        }
        return false;
    })

    $(document).on('click', '.js-favourites-clear-all', function () {
        var $this = $(this);
        var $favourites_bd = 'favourites_videos';
        var $text_delet = $('.favourites_header').attr('data-text_delet');
        var user_data_db_v = localStorage.getItem('user_data_db_v');
        if (user_data_db_v === null) {
            user_data_db_v = 1;
        }
        var request = indexedDB.open('user_data_db', user_data_db_v);
        request.onsuccess = function (event) {
            var db = event.target.result;
            var transaction = db.transaction([$favourites_bd], 'readwrite');
            var store = transaction.objectStore($favourites_bd);

            var clearRequest = store.clear();
            clearRequest.onerror = function (event) {
                console.error("Error clearing IndexedDB:", event.target.errorCode);
            };
            clearRequest.onsuccess = function (event) {
                $this.addClass('opacity');
                $('#favorites_block').html($empty_content);
                $('#pagination').html('');
                $('.js-count-favourites').html(0).hide();
                db.close();
                console.log("All favourites cleared");
            };
        };

        $('#noty_layout__topRight').find('.noty_body').html($text_delet);
        $('#noty_layout__topRight').addClass('show videos_favourites');
        setTimeout(function () {
            $('#noty_layout__topRight').removeClass('show');
            setTimeout(function () {
                $('#noty_layout__topRight').removeClass('videos_favourites');
            }, 400);
        }, 2000);

        return false;
    });

    if ($('.js-favourites').length>0) {
        $('.js-favourites').each(function(index, element) {
            var $btn = $(this);
            var $type = $btn.attr('data-type') || 'video';
            var $object_id = $btn.attr('data-object_id');
            if ($type=='video') {
                $favourites_bd = 'favourites_videos';
            }

            var user_data_db_v = localStorage.getItem('user_data_db_v');
            if(user_data_db_v===null) {
                user_data_db_v = 1;
            }

            var openRequest = indexedDB.open('user_data_db', user_data_db_v);
            openRequest.onsuccess = function(event) {
                var db = event.target.result;
                var transaction = db.transaction([$favourites_bd], 'readwrite');
                var store = transaction.objectStore($favourites_bd);
                var getRequest = store.get($object_id);

                getRequest.onerror = function(event) {
                    if (event.target.error.name === 'QuotaExceededError') {
                        alert('You have reached the maximum number of favorite content. Please remove some content from your favorites so that you can add new ones');
                    } else {
                        console.error("Error reading data from IndexedDB:", event.target.errorCode);
                    }
                };

                getRequest.onsuccess = function(event) {
                    var video = getRequest.result;
                    if (video!=undefined) {
                        $btn.attr('data-action', 'delet');
                    } else {
                        $btn.attr('data-action', 'add');
                    }
                };
            };
        });
    }
}

function getFavouritesCount(cb) {
    const openReq = indexedDB.open('user_data_db', 1);

    openReq.onerror = () => cb(null, openReq.error);

    openReq.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('favourites_videos', 'readonly');
        const store = tx.objectStore('favourites_videos');

        const countReq = store.count();

        countReq.onerror = () => { db.close(); cb(null, countReq.error); };
        countReq.onsuccess = () => { db.close(); cb(countReq.result, null); };
    };
}

getFavouritesCount(function(count, err){
    if (err) return console.error(err);
    if (count>0) {
        $('.js-count-favourites').text(count);
        $('.js-count-favourites').show(0);
    }
});