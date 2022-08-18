$(document).ready(function() {
    const options = {
        clean: true,
        connectTimeout: 5000,
        clientId: 'web_client_DF42J1',
        username: '',
        password: '',
        will: {
            topic: 'server/online',
            payload: "{\"online\": false}",
            qos: 0,
            retain: true
        }
    }
    const connectUrl = 'wss://www.eflystudio.cn:443/mqtt'
    const client = mqtt.connect(connectUrl, options)

    let settings = {}, data = {}, upgrade = {}, config = {}

    client.on('reconnect', () => {
        //$("title").text("Eemote Controller Reconnecting.....");
        console.log("Eemote Controller Reconnecting.....");
    });
    client.on("close", function () {
        //$("title").text("Eemote Controller (disconnected)");
        console.log("Eemote Controller (disconnected)");
    });
    client.on("disconnect", function (packet) {
        //$("#div1").text("从broker接收到断开连接的数据包....." + packet);
    });
    client.on("offline", function () {
        //$("title").text("Eemote Controller (Offline)");
        console.log("Eemote Controller (Offline)");
    });
    client.on("error", (error) => {
        //$("title").text("Eemote Controller (error: " + error + ")");
        console.log("Eemote Controller (error: " + error + ")");
    });
    client.on("packetsend", (packet) => {
        //$("title").text("Eemote Controller send:" + packet);
    });
    client.on("packetreceive", (packet) => {
        //$("title").text("Eemote Controller receive" + packet);
    });
    client.on("connect", function (connack) {
        //$("title").text("Eemote Controller (Connected)");
        console.log("Eemote Controller (Connected)");
        client.subscribe("esp_device/status", { qos: 2 });
        client.subscribe("esp_device/settings", { qos: 0 });
        client.subscribe("esp_device/data", { qos: 0 });
        client.publish("server/status", "{\"online\": true}", { qos: 0, retain: true })
    });
    client.on('message', (topic, message, packet) => {
        //$("#div3").text("客户端收到订阅消息,topic=" + topic + ";消息数据:" + message + ";数据包:" + packet);
        if (topic === 'esp_device/status') {
            let temp = JSON.parse(message)
            if (temp.online == true) {
                $('#title_1')[0].innerText = 'Realtime Data (online)'
            } else {
                $('#title_1')[0].innerText = 'Realtime Data (offline)'
            }
        } else if (topic === 'esp_device/settings') {
            settings = JSON.parse(message)
            if (settings.datetime.is24) {
                $('option#dt_24')[0].selected = true;
            } else {
                $('option#dt_12')[0].selected = true;
            }
            if (settings.led.sensorOn) {
                $('option#led_s_on')[0].selected = true;
            } else {
                $('option#led_s_off')[0].selected = true;
            }
            $('input#led_dot').val(settings.led.delayOffTime)
            $('input#led_bot').val(settings.led.buttonOnTime)
            $('input#led_rot').val(settings.led.remoteOnTime)
            if (settings.weather.unit) {
                $('option#wea_c')[0].selected = true;
            } else {
                $('option#wea_f')[0].selected = true;
            }
            $('input#city').val(settings.weather.city)
            $('input#sync_dsi').val(settings.sync.dataSyncInterval)
            $('input#sync_csi').val(settings.sync.clockSyncInterval)
            $('input#sync_wsi').val(settings.sync.weatherSyncInterval)
            if (settings.screen.sensorOn) {
                $('option#scr_s_on')[0].selected = true;
            } else {
                $('option#scr_s_off')[0].selected = true;
            }
            $('input#scr_li').val(settings.screen.lockInterval)
            $('input#scr_si').val(settings.screen.scrollInterval)
        } else if (topic === 'esp_device/data') {
            data = JSON.parse(message)
            $('#label_tem')[0].innerText = data.temp
            $('#label_hum')[0].innerText = data.humi
        }
    });

    $('#switch_on').click(function() {
        client.publish("esp_device/control", "{\"LED\": true}", { qos: 0, retain: false })
    })
    $('#switch_off').click(function() {
        client.publish("esp_device/control", "{\"LED\":false}", { qos: 0, retain: false })
    })

    $('#lButtonShortClick').click(function() {
        client.publish("esp_device/control", "{\"BTN\":\"LS\"}", { qos: 0, retain: false })
    })
    $('#lButtonLongClick').click(function() {
        client.publish("esp_device/control", "{\"BTN\":\"LL\"}", { qos: 0, retain: false })
    })
    $('#rButtonShortClick').click(function() {
        client.publish("esp_device/control", "{\"BTN\":\"RS\"}", { qos: 0, retain: false })
    })
    $('#rButtonLongClick').click(function() {
        client.publish("esp_device/control", "{\"BTN\":\"RL\"}", { qos: 0, retain: false })
    })

    $('#save_settings').click(function() {
        $.getJSON('https://geoapi.qweather.com/v2/city/lookup?lang=en&number=1&key=&location=' + encodeURI($('input#city').val()), function(data) {
            //console.log(data.location[0].name, data.location[0].id);
            if ($('option#dt_24')[0].selected) {
                settings.datetime.is24 = true;
            } else if ($('option#dt_12')[0].selected) {
                settings.datetime.is24 = false;
            }
            if ($('option#led_s_on')[0].selected) {
                settings.led.sensorOn = true
            } else if ($('option#led_s_off')[0].selected) {
                settings.led.sensorOn = false
            }
            settings.led.delayOffTime = $('input#led_dot').val()
            settings.led.buttonOnTime = $('input#led_bot').val()
            settings.led.remoteOnTime = $('input#led_rot').val()
            if ($('option#wea_c')[0].selected) {
                settings.weather.unit = true
            } else if ($('option#wea_f')[0].selected) {
                settings.weather.unit = false
            }
            settings.weather.city = data.location[0].name
            settings.weather.cityID = data.location[0].id
            settings.sync.dataSyncInterval = $('input#sync_dsi').val()
            settings.sync.clockSyncInterval = $('input#sync_csi').val()
            settings.sync.weatherSyncInterval = $('input#sync_wsi').val()
            if ($('option#scr_s_on')[0].selected) {
                settings.screen.sensorOn = true
            } else if ($('option#scr_s_off')[0].selected) {
                settings.screen.sensorOn = false
            }
            settings.screen.lockInterval = $('input#scr_li').val()
            settings.screen.scrollInterval = $('input#scr_si').val()
            //console.log(JSON.stringify(settings))
            client.publish("esp_device/settings", JSON.stringify(settings), { qos: 0, retain: true })
        })
    })

    $('#save_upgrade').click(function() {
        if ($('option#forced_yes')[0].selected) {
            upgrade.forced = true;
        } else if ($('option#forced_no')[0].selected) {
            upgrade.forced = false;
        }
        upgrade.version = $('input#version').val()
        upgrade.upgradeUrl = $('input#upgradeUrl').val()
        client.publish("esp_device/upgrade", JSON.stringify(upgrade), { qos: 2, retain: true })
    })

    $('#save_config').click(function() {
        config.wifiSSID = $('input#wifi_ssid').val()
        config.wifiPASS = $('input#wifi_pass').val()
        config.apiTimeUrl = $('input#api_time').val()
        config.apiWeatherUrl = $('input#api_wea').val()
        config.apiWeatherKey = $('input#api_wea_api').val()
        client.publish("esp_device/config", JSON.stringify(config), { qos: 0, retain: true })
    })

    $(window).bind("beforeunload", () => {
        client.disconnect();
    })

})