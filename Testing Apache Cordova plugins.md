Здравствуй, читатель. Я собираюсь рассказать об одной из тем, касающихся Apache Cordova, которая практически не освещена в рунете - как тестировать свой плагин для Apache Cordova.

В рамках этой статьи мы будем тестировать только JavaScript код, поскольку такие тесты довольно легко внедрить и зачастую их будет достаточно. Конечно, как правило плагины содержат и нативный код для каждой из поддерживаемых платформ, который тоже неплохо было бы покрыть unit-тестами, но мы пока оставим этот вопрос за кадром, поскольку этот аспект тестирования плагинов практически не распространен и остуствует какой либо инструментарий для такого тестирования. В любом случае, код JavaScript как правило вызывает нативную логику, и поэтому наши тесты будут косвенно тестировать и реализацию под каждую платформу.

<cut />

## Немного теории

Итак, каким образом осуществляется тестирование плагинов для Apache Cordova. Прежде всего, архитектура тестов состоит из двух частей:

1. Собственно тесты, использующие ту или иную библиотеку для тестирования.
2. Так называемая test harness, или часть кода ответственная за запуск тестов и генерацию результатов теста.

В случае с плагинами в качестве библиотеки используется BDD-фреймворк Jasmine - довольно популярный в JavaScript мире. Соответственно будущие тесты могут выглядеть примерно так (отрывок взят из тестов для [`cordova-plugin-device`](https://github.com/apache/cordova-plugin-device) - одного из плагинов, поддерживаемых сообществом Apache Cordova):

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

Самым простым способом здесь будет использование [`cordova-plugin-test-framework`](https://github.com/apache/cordova-plugin-test-framework) - еще одного плагина, который добавляет в приложение интерфейс для запуска тестов в виде отдельной страницы с элементами упраления для запуска, остановки и выбора тестов для запуска, а так же осуществляет загрузку всех обьявленных тестов во время работы приложения и их запуск.

Вот как это выглядит в работе:

<img src="https://habrastorage.org/files/849/5b5/80b/8495b580bfae484d8d7124392e0b0b0a.png" width="300"/> <img src="https://habrastorage.org/files/1c7/4b2/ee2/1c74b2ee2410412c870d45577939ca40.png" width="300"/>

Кроме того `test-framework` предоставляет возможность быстро создать т.н. ручные тесты - создать несколько кнопок на отдельной странице с описанием действий связанных с нажатием на каждую кнопку и ожидаемого поведения приложения.

README плагина описывает, как он работает и как нужно добалять тесты, чтобы они были добавлены в `test-framework`, однако содержит некоторые неточности, поэтому вкратце приведу основные тезисы здесь.

1. Для обьявления тестов их нужно выделить в отдельный плагин. Расположение плагина не критично, но часто он находится внутри подпапки `/tests` основного плагина.
2. Сами тесты должны находиться в модуле с именем, оканчивающимся на `tests`, (например `<js-module src="tests/tests.js" name="my.plugin.tests">`)
3. Модуль с тестами должен экспортировать две функции:

```javascript
exports.defineAutoTests = function() { };
exports.defineManualTests = function(contentEl, createActionButton) {};
```

которые будут выполнены при загрузке модуля. Название функций говорит само за себя.

4. Полезно так же будет добавить `cordova-plugin-test-framework` - а возможно еще и тестируемый плагин - в качестве зависимости для ваших тестов, чтобы они устанавливались автоматически вместе с тестами. Это делается добавлением следующих элементов в `tests/plugin.xml`:

```xml
<dependency id="cordova-plugin-test-framework"/>
<dependency id="my-awesome-plugin" url=".." />
```

## Создаем каркас плагина

Итак, после того, как все подготовлено для написания, какркас плагина должен выглядеть примерно следующим образом:
<img src="https://habrastorage.org/files/1d3/7fc/e7b/1d37fce7b4724be3a805f1a56f4598ee.JPG"/><br>

`plugin.xml` будет выглядеть так:
```xml
<plugin xmlns="http://apache.org/cordova/ns/plugins/1.0"
    id="my-awesome-tests" version="0.0.1">
    <name>My Awesome Plugin Tests</name>
    <dependency id="cordova-plugin-test-framework" />
    <dependency id="my-awesome-plugin" url=".." />
    <js-module src="tests.js" name="tests" />
</plugin>
```

`tests.js`:

```javascript
exports.defineAutoTests = function() {
    // To be done
};
exports.defineManualTests = function(content, createActionButton) {
    // To be done
};
```

Это можно сделать вручную в вашем `$EDITOR`, а можно использовать `plugman` - еще один инструмент для работы с плагинами Apache Cordova:

    npm install -g plugman
    plugman create --name "My awesome plugin tests" --plugin_id my-awesome-plugin-tests --plugin_version 0.0.1 --path=./tests

чтобы сгенерировать каркас плагина и отредактировать файлы вручную.

## Пишем автоматические тесты

Теперь перейдем непосредственно к написанию тестов. Те кто уже знакомы с BDD и jasmine могут пропустить этот раздел, т.к. ничего нового здесь не будет, и перейти к следующему.

Примеры далее в этой статье основаны на простом плагине, написанном за 10 минут в демонстрационных целях. Код плагина можно найти на [GitHub](https://github.com/vladimir-kotikov/my-awesome-plugin).

Итак, сначала создаем каркас тестового плагина, как описано в предыдущем разделе и начинаем наполнять его тестами.

```javascript
exports.defineAutoTests = function() {
    describe('plugin', function() {
        it('should be exposed as cordova.plugins.MyAwesomePlugin object', function() {
            expect(cordova.plugins.MyAwesomePlugin).toBeDefined();
            expect(cordova.require('my-awesome-plugin.MyAwesomePlugin'))
                .toBe(cordova.plugins.MyAwesomePlugin);
        });

        it('should have corresponding methods defined', function() {
            ['coolMethod', 'logCoolMessage'].forEach(function(methodName) {
                expect(cordova.plugins.MyAwesomePlugin[methodName]).toBeDefined();
                expect(cordova.plugins.MyAwesomePlugin[methodName]).toEqual(jasmine.any(Function));
            });
        });
    });
};
```

Пока этого достаточно. Теперь создадим тестовое приложение и запустим наши тесты. Для этого выполняем следующие команды в папке с _тестируемым_ плагином:

    cordova create my-sample-app && cd my-sample-app
    cordova platform add android --save
    cordova plugin add .. ../tests --save

и правим элемент `<content src="index.html" />` в файле `config.xml` внутри нашего тестового приложения - меняем значение на `cdvtests/index.html`. Это необходимо чтобы вместо основной стартовой страницы при запуске приложения открылась страница плагина и загрузился `test-framework`.

Теперь запускаем приложение:

    cordova run

и видим страницу плагина. Нажимаем "Autotests" и практически сразу видим отчет jasmine об успешном завершении тестов.

<img src="https://habrastorage.org/files/3da/721/f9b/3da721f9bb4046209e61fb9a4060576a.png" width="300"/><br>

## Добавляем ручные тесты

Теперь, понимая как работает `test-framework`, можно без особых проблем написать любое количество автоматических тестов для вашего плагина.

С ручными тестами все работает немного по-другому. `test-framework` предполагает, что каждому тесту полагается отдельная кнопка в интерфейсе, которая выполняет какие-то действия и общее для всех тестов поле в которое можно вывести свои результаты. Это параметры `createActionButton` и `content` соответственно для функции `defineManualTests`.

`createActionButton` это фунция, которая создает кнопку, добавляет ее в DOM внутрь указанного элемента и выполняет указанную функцию при нажатии кнопки. параметры фунции выглядят так:

    `function createActionButton('Текст кнопки', выполняемая_функция, 'ИД_элемента') {...}`

`content` это контейнер на странице, внутри которого можно поместить описание и назначение теста и описать процесс верификации для тестировщика.

Для примера добавим один ручной тест:

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
    ...
    "test-android": "cordova-paramedic --platform android --plugin ./ --verbose",
    "test-ios": "cordova-paramedic --platform ios --plugin ./ --verbose"
},
```

Все. Теперь вместо того чтобы собирать приложение вручную, править его `config.xml`, запускать и потом смотреть как появляются точки и крестики пройденных и упавших тестов просто запускаем соответствующий скрипт, например для Android:

    npm run test-android

И через некоторое время получаем результаты тестов на консоль:

```
...
Results: ran 2 specs with 0 failures
result code is : 0
{"mobilespec":{"specs":2,"failures":0,"results":[]},"platform":"Desktop","version":"5.1.0","timestamp":1455530481,"model":"none"}
```

Теперь становится очень просто запускать тесты на CI-сервере. Возьмем для примера Travis CI и Circle CI:

`.travis.yml`

```yaml
language: objective-c
install:
  - npm install
script:
  - npm run test-ios
```

`circle.yml`

```yaml
test:
  pre:
    - emulator -avd circleci-android21 -no-audio -no-window:
        background: true
        parallel: true
    - circle-android wait-for-boot
  override:
    - npm run test-android
```

Затем идем в панель управления соответствующего сервиса, включаем интеграцию с GitHub и наслаждаемся:

<img src="https://habrastorage.org/files/422/757/600/4227576009d14b1691429b74d5799db5.JPG" width="300"/><br>

## Заключение

Итак, теперь мы имеем плагин покрытый автоматическими тестами, умеем создавать и запускать тестовое приложение буквально одной-двумя строчками в терминале, и знаем состояние кода, обновляющееся per-commit.

Напоследок еще раз приведу ссылку на демонстрационный плагин: https://github.com/vladimir-kotikov/my-awesome-plugin. Посмотреть этапы добавления тестов можно по истории коммитов.

Удачного тестирования!
