var etch = $('#etch canvas')[0],
    context = etch.getContext('2d'),
    /* Center at first */
    cur_x = 155.5, cur_y = 75.5,
    /* Rotation for knobs */
    rot_x = rot_y = 0,
    /* The path object (and current index) */
    path = {0: [cur_x, cur_y]}, i = 0,
    /* Current direction the user is drawing */
    current_direction = false,
    /* Does this have localStorage? */
    has_local_storage = supports_local_storage();

/* Set up the line color and width */
context.strokeStyle = "rgba(90,90,90,0.9)";
context.lineWidth = 0.5;

/* Get a URL for the user. */
function getURL() {
    return "http://localhost:8001/#" + getHash();
}

/* Get the hash from the path */
function getHash() {
    return Base64.encode(JSON.stringify(path))
}

/* The user just pressed an arrow key. */
function drawLine(x, y) {
    // Set up the path stuff
    context.beginPath();
    context.moveTo(cur_x, cur_y);

    // Set the new new location.
    cur_x += 2 * x;
    cur_y += 2 * y;

    // Set the rotation of the knobs.
    rot_x += 1 * x;
    rot_y += 1 * y;

    // Set the direction the user is currently drawing.
    var new_direction = x + "--" + y;
    if(current_direction != new_direction) {
        // New direction, so we need to add a new line.
        i++;
        current_direction = new_direction;
    }
    // Update or add a new line.
    path[i] = [cur_x, cur_y];

    // Rotate the knob (Fx only so far).
    $('.knob_l').css('-moz-transform', 'rotate(' + rot_x * 50 + 'deg)');
    $('.knob_r').css('-moz-transform', 'rotate(' + rot_y * 50 + 'deg)');

    // Draw the line and stroke it.
    context.lineTo(cur_x, cur_y);
    context.closePath();
    context.stroke();

    /* TODO: Make this async! */
    if(has_local_storage){
        window.localStorage['path'] = getHash();
    }
}

/* We're ready to go! */
$(function() {
    $(document).keydown(function(e) {
        if(e.keyCode == jQuery.ui.keyCode.RIGHT) {
            drawLine(1, 0);
        } else if(e.keyCode == jQuery.ui.keyCode.LEFT) {
            drawLine(-1, 0);
        } else if(e.keyCode == jQuery.ui.keyCode.UP) {
            drawLine(0, -1);
        } else if(e.keyCode == jQuery.ui.keyCode.DOWN) {
            drawLine(0, 1);
        } else {
            return; // Not an arrow key; carry on!
        }
        // It is an arrow; so don't move the page.
        e.preventDefault();
    });

    /* Do we have a saved one? */
    var existing = false;

    // Check localStorage
    if(has_local_storage){
        existing = window.localStorage['path'];
    }

    // Check the hash
    if(location.hash && location.hash.length > 5) {
        existing = location.hash.replace(/#/, '')
    }

    // We found something!
    if(existing) {
        try {
            var existing_json = JSON.parse(Base64.decode(existing)),
            go_x, go_y;
        } catch(e) {
            return; // We couldn't parse it.  Ah well, we tried.
        }

        // Draw all the lines.  TODO: combine this with above.
        $.each(existing_json, function(k, v) {
            context.beginPath();
            context.moveTo(go_x, go_y);

            context.lineTo(v[0], v[1]);
            context.closePath();
            context.stroke();

            go_x = v[0];
            go_y = v[1];
        });

        // Set the starting points.
        path = existing_json;
        cur_x = go_x;
        cur_y = go_y;
    }
});

/* Shake and bake */
var pos_x = pos_y = false,
    direction_x = direction_y = 0,
    total_x = total_y = 0,
    timer = false;

$( "#etch" ).draggable({ revert: true, scroll: false,
    start: function(){
        /* Every 300 miliseconds it's being dragged, take away a shake.
         * This is so we can move it around slowly without it being cleared. */
        timer = setInterval(function(){
            total_x--;
            total_y--;
            if(total_x < 0) total_x = 0;
            if(total_y < 0) total_y = 0;
        }, 300);
    },
    drag: function(e){
        var new_direction_x = e.pageX - pos_x > 0 ? 1 : -1,
            new_direction_y = e.pageY - pos_y > 0 ? 1 : -1;

        // If it's moved 10+ pixels and it's moved in another direction...
        if(Math.abs(e.pageX - pos_x) > 10 && new_direction_x != direction_x) {
            direction_x = new_direction_x;
            total_x++;
        }
        if(Math.abs(e.pageY - pos_y) > 10 && new_direction_y != direction_y) {
            direction_y = new_direction_y;
            total_y++;
        }

        // Set the "old" position of the div.
        pos_x = e.pageX;
        pos_y = e.pageY;

        // If the modal has changed directions 4+ times, reset.
        if(total_x >= 4 || total_y >= 4) {
            // TODO: create a new "Clear" function.
            context.clearRect(0,0,1000,1000);
            path = {0: [cur_x, cur_y]};
            i = 0;
        }
    },
    stop: function() {
        // Collaborate and listen.
        pos_x = pos_y = false;
        direction_x = direction_y = 0;
        total_x = total_y = 0;
        clearInterval(timer);
    }
});

// Does it support local storage?
function supports_local_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e){
        return false;
    }
}
