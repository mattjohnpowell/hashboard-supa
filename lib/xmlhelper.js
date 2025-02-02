

    function _parseFromString(xmlText) {

        if (!xmlText) return;
        xmlText = _encodeCDATAValues(xmlText);
        var cleanXmlText = xmlText.replace(/\s{2,}/g, ' ').replace(/\\t\\n\\r/g, '').replace(/>/g, '>\n').replace(/\]\]/g, ']]\n');
        var rawXmlData = [];

        cleanXmlText.split('\n').map(element => {
            element = element.trim();

            if (!element || element.indexOf('?xml') > -1) {
                return;
            }

            if (element.indexOf('<') == 0 && element.indexOf('CDATA') < 0) {
                var parsedTag = _parseTag(element);

                rawXmlData.push(parsedTag);

                if (element.match(/\/\s*>$/)) {
                    rawXmlData.push(_parseTag('</' + parsedTag.name + '>'));
                }
            } else {
                rawXmlData[rawXmlData.length - 1].value += ` ${_parseValue(element)}`;
            }

        });

        return _convertTagsArrayToTree(rawXmlData)[0];
    }

    function _encodeCDATAValues(xmlText) {
        var cdataRegex = new RegExp(/<!\[CDATA\[([^\]\]]+)\]\]/gi);
        var result = cdataRegex.exec(xmlText);
        while (result) {
            if (result.length > 1) {
                xmlText = xmlText.replace(result[1], encodeURIComponent(result[1]));
            }

            result = cdataRegex.exec(xmlText);
        }

        return xmlText;
    }

    function _getElementsByTagName(tagName) {
        var matches = [];

        if (tagName == '*' || name.toLowerCase() === tagName.toLowerCase()) {
            matches.push(this);
        }

        children.map(child => {
            matches = matches.concat(child.getElementsByTagName(tagName));
        });

        return matches;
    }

    function _parseTag(tagText, parent) {
        var cleanTagText = tagText.match(/([^\s]*)=('([^']*?)'|"([^"]*?)")|([\/?\w\-\:]+)/g);

        var tag = {
            name: cleanTagText.shift().replace(/\/\s*$/, ''),
            attributes: {},
            children: [],
            value: '',
            getElementsByTagName: _getElementsByTagName
        };

        cleanTagText.map(attribute => {
            var attributeKeyVal = attribute.split('=');

            if (attributeKeyVal.length < 2) {
                return;
            }

            var attributeKey = attributeKeyVal[0];
            var attributeVal = '';

            if (attributeKeyVal.length === 2) {
                attributeVal = attributeKeyVal[1];
            } else {
                attributeKeyVal = attributeKeyVal.slice(1);
                attributeVal = attributeKeyVal.join('=');
            }

            tag.attributes[attributeKey] = 'string' === typeof attributeVal ? (attributeVal.replace(/^"/g, '').replace(/^'/g, '').replace(/"$/g, '').replace(/'$/g, '').trim()) : attributeVal;
        });

        return tag;
    }

    function _parseValue(tagValue) {
        if (tagValue.indexOf('CDATA') < 0) {
            return tagValue.trim();
        }

        return tagValue.substring(tagValue.lastIndexOf('[') + 1, tagValue.indexOf(']'));
    }

    function _convertTagsArrayToTree(xml) {
        var xmlTree = [];

        while (xml.length > 0) {
            var tag = xml.shift();

            if (tag.value.indexOf('</') > -1 || tag.name.match(/\/$/)) {
                tag.name = tag.name.replace(/\/$/, '').trim();
                tag.value = tag.value.substring(0, tag.value.indexOf('</')).trim();
                xmlTree.push(tag);
                continue;
            }

            if (tag.name.indexOf('/') == 0) {
                break;
            }

            xmlTree.push(tag);
            tag.children = _convertTagsArrayToTree(xml);
            tag.value = decodeURIComponent(tag.value.trim());
        }
        return xmlTree;
    }

    function _toString(xml) {
        var xmlText = _convertTagToText(xml);


        if (xml.children.length > 0) {
            xml.children.map(child => {
                xmlText += _toString(child);
            });

            xmlText += '</' + xml.name + '>';
        }

        return xmlText;
    }

    function _convertTagToText(tag) {
        var tagText = '<' + tag.name;
        var attributesText = [];

        for (var attribute in tag.attributes) {
            tagText += ' ' + attribute + '="' + tag.attributes[attribute] + '"';
        }

        if (tag.value.length > 0) {
            tagText += '>' + tag.value;
        } else {
            tagText += '>';
        }

        if (tag.children.length === 0) {
            tagText += '</' + tag.name + '>';
        }

        return tagText;
    }

    export default function parseFromString(xmlText) {
        return _parseFromString(xmlText.toString());
    }

    function toString(xml) {
        return _toString(xml);
    }
