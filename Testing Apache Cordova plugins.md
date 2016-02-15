
# Тестирование плагинов Apache Cordova

Статья предназначена для разработчиков плагинов, которые хотели бы добавить тесты для своих плагинов.

Речь пойдет о тестировании JavaScript кода. Поскольку именно эта часть плагина предоставляет внешний интерфейс и будет доступна в рабочем приложении. то наши тесты будут тестировать приложение как черный ящик, без учета деталей внутренней реализации плагина.

Конечно, зачастую плагины содержат и нативный код для каждой из поддерживаемых платформ, который тоже неплохо было бы покрыть unit-тестами, но мы пока оставим этот вопрос за кадром, поскольку этот аспект тестирования плагинов практически не распространен и остуствует какой либо инструментарий для такого тестирования.

## Немного теории

Итак, каким образом осуществляется тестирование плагинов для Apache Cordova. Прежде всего, архитектура тестов состоит из двух частей:

1. Собственно тесты, использующие ту или иную библиотеку для тестирования.
2. Так называемая test harness, или часть кода ответственная за запуск тестов и генерацию результатов теста.

В случае с плагинами, для написания тестов используется Jasmine 2.2 - довольно популярный BDD-фреймворк. Соответственно ваши будущие тесты могут выглядеть примерно так (отрывок взят из тестов для [cordova-plugin-device](https://github.com/apache/cordova-plugin-device) - одного из плагинов, поддерживаемых сообществом Apache Cordova):

```javascript
it("should exist", function() {
  expect(window.device).toBeDefined();
});

it("should contain a platform specification that is a string", function() {
  expect(window.device.platform).toBeDefined();
  expect((new String(window.device.platform)).length > 0).toBe(true);
});

it("should contain a version specification that is a string", function() {
  expect(window.device.version).toBeDefined();
  expect((new String(window.device.version)).length > 0).toBe(true);
});
```

Если с кодом тестов все достаточно ясно и понятно, то для того чтобы их запустить, необходимо проделать дополнительные манипуляциию

Самым простым способом здесь будет использование [cordova-plugin-test-framework](https://github.com/apache/cordova-plugin-test-framework) - другого плагина, который добавляет в приложение интерфейс для запуска тестов в виде отдельной страницы с элементами упраления для запуска, остановки и выбора тестов для запуска, а так же осуществляет загрузку всех обьявленных тестов во время работы приложения и их запуск.

README плагина описывает, как он работает и как нужно добалять тесты, чтобы они были добавлены в test-framework, однако содержит некоторые неточности, поэтому вкратце приведу основные тезисы здесь.

1. Для обьявления тестов их нужно выделить в отдельный плагин. Расположение плагина не критично, но часто он находится внутри подпапки `/tests` основного плагина.
2. Сами тесты должны находиться в модуле с именем, оканчивающимся на `.tests`, (например `<js-module src="tests/tests.js" name="my.plugin.tests">`)
3. Модуль с тестами должен экспортировать две функции:

```javascript
exports.defineAutoTests = function() { };
exports.defineManualTests = function(contentEl, createActionButton) {};
```

которые будут выполнены при загрузке модуля. Название функций говорит само за себя.

4. Полезно так же будет добавить `cordova-plugin-test-framework` в качестве зависимости для ваших тестов, чтобы он устанавливался автоматически при установке плагина с тестами. Это делается добавлением следующего элемента в `tests/plugin.xml`:

```xml
<dependency id="cordova-plugin-test-framework"/>
```

## Создаем каркас плагина

Итак, после того, как все подготовлено для написания, какркас плагина будет выглядеть следующим образом:

```
my-awesome-plugin/
|--tests/
|  |--plugin.xml
|  |--tests.js
... 
```

`plugin.xml` будет выглядеть так:

```xml
<plugin xmlns="http://apache.org/cordova/ns/plugins/1.0"
    id="my-awesome-tests" version="0.0.1">
    <name>My Awesome Plugin Tests</name>
    <dependency id="cordova-plugin-test-framework" />
    <js-module src="tests.js" name="tests" />
</plugin>
```

`tests.js`:

```javascript
exports.defineAutoTests = function() {
    // To be done
};
exports.defineManualTests = function(contentEl, createActionButton) {
    // To be done
};
```

<!-- TODO:
    1. уточнить название переменной
    2. Установка plugman
-->
Это можно сделать вручную в вашем `$EDITOR`, а можно использовать `plugman`:

    plugman create --name "My awesome plugin tests" --plugin_id my-awesome-plugin-tests --plugin_version 0.0.1

чтобы сгенерировать каркас плагина и отредактировать файлы вручную.

## Пишем автоматические тесты

Теперь перейдем непосредственно к написанию тестов. Те кто уже знакомы с BDD и jasmine могут пропустить этот раздел, т.к. ничего нового здесь не будет, и перейти к следующему.

Чтобы не приводить абстрактных примеров я решил взять плагин `me.apla.cordova.app-preferences` от небезызвестного **[@apla](https://github.com/apla)**.

Итак, сначала создаем каркас тестового плагина, как описано в предыдущем разделе и начинаем наполнять его тестами.

```javascript
exports.defineAutoTests = function() {
    describe('plugin', function() {
        it('should be exposed as plugins.appPreferences object', function() {
            expect(window.plugins.appPreferences).toBeDefined();
            expect(cordova.require('cordova-plugin-app-preferences.apppreferences'))
                .toBe(window.plugins.appPreferences);
        });

        it('should have corresponding methods defined', function() {
            ['store', 'fetch', 'remove', 'show', 'iosSuite'].forEach(function(methodName) {
                expect(window.plugins.appPreferences[methodName]).toBeDefined();
                expect(window.plugins.appPreferences[methodName]).toEqual(jasmine.any(Function));
            });
        });
    });
});
```

Пока этого достаточно. Теперь создадим тестовое приложение и запустим наши тесты. Для этого нужно выполнить следующие команды:

    cordova create TestApp && cd testApp
    cordova platform add android --save
    cordova plugin add ../MyAwesomePlugin ../MyAwesomePlugin/tests --save

Теперь правим элемент `<content src="index.html" />` в файле `config.xml` внутри нашего тестового приложения и меняем значение на `cdvtests/index.html`. Это необходимо чтобы вместо основной стартовой страницы при запуске приложения открылась страница плагина и загрузился `test-framework`.

Теперь запускаем приложение:

    cordova run

<!-- TODO:
    1. уточнить название кнопки
    2. скриншот
-->
и видим страницу с тестами, нажимаем "Autotests" и видим отчет jasmine об успешном завершении тестов.

## Добавляем ручные тесты

Теперь, понимая как работает `test-framework`, можно без особых проблем написать любое количество автоматических тестов для вашего плагина.

С ручными тестами все работает немного по другому. `test-framework` предполагает, что каждому тесту полагается отдельная кнопка в интерфейсе, которая выполняет какие-то действия и общее для всех тестов поле в которое можно вывести свои результаты. Это параметры `createActionButton` и `contentEl` соответственно для функции defineManualTests.

`createActionButton` это фунция, которая создает кнопку, добавляет ее в DOM внутрь указанного элемента и выполняет указанную функцию при нажатии кнопки. параметры фунции выглядят так:

`function createActionButton('Текст кнопки', выполняемая_функция, 'ИД_элемента') {...}`

`contentEl` это контейнер на странице, внутри которого можно поместить описание и назначение теста и описать процесс верификации для тестировщика.

Попробуем определить один ручной тест:

<!-- TODO: update `device_tests` variable name and text -->

```javascript
exports.defineManualTests = function(contentEl, createActionButton) {

    var show_preferences_test =
        '<h3>Press "Open preferences" button to show preferences pane</h3>' +
        '<div id="open_prefs"></div>' +
        'Expected result: A "Preferences"  box should appear';

    contentEl.innerHTML = '<div id="info"></div>' + show_preferences_test;

    var log = document.getElementById('info');
    var logMessage = function (message) {
        var logLine = document.createElement('div');
        logLine.innerHTML = message;
        log.appendChild(logLine);
    };

    createActionButton('Open preferences', function() {
        log.innerHTML = ''; // cleanup log area
        plugins.appPreferences.show(function(result) {
            logMessage(result);
        }, function(error) {
            logMessage(error);
        });
    }, "open_prefs");
};
```

Теперь нам нужно пересобрать приложение с обновленным плагином. Для этого просто удалим плагин из приложения и попробуем запустить приложение.

    cordova plugin rm my-awesome-plugin-tests && cordova run

Команда `run` перед сборкой приложения восстановит удаленный плагин из его первоначального местоположения вместе с обновленными файлами и все изменения будут включены в приложение.

## Запускаем тесты на CI

Пересобирать приложение для того чтобы запустить тесты еще раз - довольно рутинное занятие, которое конечно хочется делать автоматически. Вместо того чтобы изобретать собственный велосипед, воспользуемся готовым решением - `cordova-paramedic`. Это приложение написано специально для того чтобы автоматизировать запуск тестов для плагинов в т.ч. и на CI-серверах. Вот что оно делает:

  * создает новое приложение во временной папке
  * добавляет в приложение необходимы для запуска тестов плагины
  * изменяет стартовую страницу приложения
  * запускает локальный сервер для коммуникации с приложением и обработки результатов
  * выводит результат запуска тестов на консоль
  * завершается с соответствующим кодом в зависимости от того, прошли ли все тесты успешно или нет.

Для того чтобы начать использовать `paramedic`, установим его и добавим в `package.json` нашего плагина:

    npm install cordova-paramedic --save-dev

и добавим пару команд для запуска тестов для iOS и Android.

```json
"scripts": {
    "test-android": "cordova-paramedic --platform android --plugin ./ --verbose",
    "test-ios": "cordova-paramedic --platform ios --plugin ./ --verbose"
},
```

Все. Теперь вместо того чтобы собирать приложение вручную, править его `config.xml`, запускать и потом смотреть как появляются точки и крестики пройденных и упавших тестов просто запускаем соответствующий скрипт, например для Android:

    npm run test-android

И через некоторое время получаем результаты тестов на консоль.

```
...
console-log:posting tests
Results: ran 2 specs with 0 failures
result code is : 0
{"mobilespec":{"specs":2,"failures":0,"results":[]},"platform":"Desktop","version":"5.1.0","timestamp":1455530481,"model":"none"}
```

Теперь становится очень просто запускать тесты на CI-сервере. Возьмем для примера Travis CI и Circle CI:

`.travis.yml`

```yaml
language: objective-c
before_install:
  - git clone https://github.com/creationix/nvm.git /tmp/.nvm;
    source /tmp/.nvm/nvm.sh;
    nvm install 4.2.6;
    nvm use --delete-prefix 4.2.6;
install:
  - npm install
script:
  - npm run test-ios
```

`circle.yml`

```yaml
machine:
  environment:
    ANDROID_NDK_HOME: $ANDROID_NDK
  node:
    version: 4.2.6

test:
  pre:
    - emulator -avd circleci-android21 -no-audio -no-window:
        background: true
        parallel: true
    - circle-android wait-for-boot
  override:
    - npm run test-android
```

Затем идем в панель управления соответствующего сервиса, включаем интеграцию с GitHub и наслаждаемся.

## Заключение

Итак, теперь мы имеем плагин покрытый автоматическими тестами, умеем создавать и запускать тестовое приложение буквально одной-двумя строчками в терминале, и знаем состояние кода, обновляющееся per-commit.

<!-- TODO: Add Github repo link -->
Для тех кто хочет посмотреть на пример тестового плагина "живьем" - кот выложен на GitHub [здесь]()
