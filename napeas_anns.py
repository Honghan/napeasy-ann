import utils
import json


class NapEasyAnn(object):
    """
    NapEasy annotation class
    """
    def __init__(self, id):
        self._id = id
        self._selector = None
        self._text_node_index = -1
        self._offset_start = -1
        self._offset_end = -1
        self._text = None
        self._type = None

    @property
    def selector(self):
        return self._selector

    @selector.setter
    def selector(self, value):
        self._selector = value

    @property
    def text_node_index(self):
        return self._text_node_index

    @text_node_index.setter
    def text_node_index(self, value):
        self._text_node_index = value

    @property
    def offset_start(self):
        return self._offset_start

    @offset_start.setter
    def offset_start(self, value):
        self._offset_start = value

    @property
    def offset_end(self):
        return self._offset_end

    @offset_end.setter
    def offset_end(self, value):
        self._offset_end = value

    @property
    def text(self):
        return self._text

    @text.setter
    def text(self, value):
        self._text = value

    @property
    def type(self):
        return self._type

    @type.setter
    def type(self, value):
        self._type = value


def output_ann(ann):
    return '%s\t%s\t%s\t%s\t%s\t%s' % \
           (ann.selector, ann.text_node_index,
            ann.offset_start, ann.offset_end,
            ann.text, ann.type)


def process_anns(ann_file, short_name_file=None):
    name_mapping = {}
    if short_name_file is not None:
        lines = utils.read_text_file(short_name_file)
        for l in lines:
            arr = l.split('\t')
            for idx in range(1, len(arr)):
                if arr[idx].strip() != '':
                    name_mapping[arr[idx]] = arr[0]
    print name_mapping

    type2item = {}

    lines = utils.read_text_file(ann_file)
    output = ''
    type2textnodes = {}
    type2num_mentions = {}
    type2articles = {}
    for l in lines:
        arr = l.split('\t')
        article = arr[0]
        id2anns = json.loads(arr[1])
        output += arr[0] + '\n'
        for id in id2anns:
            a = id2anns[id]
            d = a['selected'][0]
            if d['r_index'] == -1:
                continue
            ann = NapEasyAnn(id)
            ann.selector = d['loc']
            ann.text_node_index = d['r_index']
            ann.offset_start = d['r_start']
            ann.offset_end = d['r_end']
            ann.text = d['text'] if 'text' in d else '---'
            ann.type = name_mapping[a['meta']] if a['meta'] in name_mapping else a['meta']
            output += output_ann(ann) + '\n'

            type2num_mentions[ann.type] = 1 if ann.type not in type2num_mentions else 1 + type2num_mentions[ann.type]
            type2articles[ann.type] = [article] if ann.type not in type2articles else [article] + type2articles[ann.type]
            tnode_id = article + ' ' + ann.selector + ' ' + str(ann.text_node_index)
            type2textnodes[ann.type] = [tnode_id] if ann.type not in type2textnodes \
                else [tnode_id] + type2textnodes[ann.type]

            #if ann.type != 'The conclusion/finding':
            type2item[ann.type] = [ann.text] if ann.type not in type2item else type2item[ann.type] + [ann.text]
        output += '\n'

    output += 'vocabularies\n'
    for t in type2item:
        type2item[t] = sorted(list(set([s.strip() for s in type2item[t]])))
        output += '%s\t%s\n' % (t, len(type2item[t]))
        output += '\n'.join(type2item[t])
        output += '\n\n'

    output += '\ntype to node number\n'
    for t in type2textnodes:
        output += '%s\t%s\n' % (t, len(set(type2textnodes[t])))
    print output

    for t in type2num_mentions:
        num_articles = len(set(type2articles[t]))
        print '%s\t%s\t%s' % (t, type2num_mentions[t], num_articles)


def main():
    process_anns('./resources/napeasy_anns_v2.txt', './resources/short_names.txt')


if __name__ == "__main__":
    main()
