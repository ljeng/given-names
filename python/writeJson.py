from collections import defaultdict
import csv
import json
import os

sex_map = {'F': 'female', 'M': 'male'}
load = lambda folder, filename: json.load(open(os.path.join('..',
    'json',
    folder,
    filename + '.json'), 'r'))
dump = lambda obj, folder, filename: json.dump(
    obj,
    open(os.path.join('..', 'json', folder, filename + '.json'), 'w'))

def jsonify(folders):
    geo_dict = defaultdict(lambda: defaultdict(int))
    sex_dict = defaultdict(lambda: defaultdict(int))
    birth_year_dict = defaultdict(lambda: defaultdict(int))
    name_sum = defaultdict(int)
    geo_sum = defaultdict(int)
    sex_sum = defaultdict(int)
    birth_year_sum = defaultdict(int)
    for folder in folders:
        path = os.path.join('..', folder)
        for filename in os.listdir(path):
            if filename.endswith('.TXT'):
                for line in open(os.path.join(path, filename), 'r'):
                    geo, sex, birth_year, name, occurrences = line.strip().split(',')
                    occurrences = int(occurrences)
                    geo_dict[geo][name] += occurrences
                    sex_dict[sex_map[sex]][name] += occurrences
                    birth_year_dict[birth_year][name] += occurrences
                    name_sum[name] += occurrences
                    geo_sum[geo] += occurrences
                    sex_sum[sex] += occurrences
                    birth_year_sum[birth_year] += occurrences
    for obj, filename in [
        (geo_dict, 'geo'),
        (sex_dict, 'sex'),
        (birth_year_dict, 'birth_year')]:
        dump(obj, 'count', filename)
    sum_occurrences = sum(name_sum.values())
    dump({name: occurrences / sum_occurrences for name, occurrences in name_sum.items()},
        'sum',
        'name')
    for obj, filename in [
        (geo_sum, 'geo'),
        (sex_sum, 'sex'),
        (birth_year_sum, 'birth_year')]:
        dump(obj, 'sum', filename)

def normalize(filename):
    input_dict = load('count', filename)
    divisor_dict = load('sum', 'name')
    sum_values = sum(divisor_dict.values())
    output_dict = defaultdict(lambda: defaultdict(float))
    for superkey, supervalue in input_dict.items():
        sum_supervalues = sum(supervalue.values())
        for subkey, subvalue in supervalue.items():
            output_dict[superkey][subkey] = subvalue / sum_supervalues / divisor_dict[subkey]
    dump(output_dict, 'normalized', filename)

def jsonifyRace(filename):
    reader = csv.reader(open(filename, 'r'))
    next(reader)
    count_dict = defaultdict(lambda: defaultdict(float))
    race_sum = defaultdict(float)
    firstname_sum = defaultdict(float)
    for line in reader:
        firstname, obs, pcthispanic, pctwhite, pctblack, pctapi, pctaian, pct2prace = line
        firstname = firstname[0] + firstname[1:].lower()
        obs = int(obs)
        for race, pct in [('Hispanic', pcthispanic),
            ('White', pctwhite),
            ('Black', pctblack),
            ('Asian', pctapi),
            ('Indigenous', pctaian),
            ('Mixed', pct2prace)]:
            obs_pct = obs * float(pct) / 100
            count_dict[race][firstname] += obs_pct
            race_sum[race] += obs_pct
            firstname_sum[firstname] += obs_pct
    dump(count_dict, 'count', 'race')
    dump(race_sum, 'sum', 'race')
    sum_obs = sum(race_sum.values())
    dump({firstname: obs_pct / sum_obs for firstname, obs_pct in firstname_sum.items()},
        'sum',
        'name.race')

def normalizeRace():
    filename = 'race'
    input_dict = load('count', filename)
    divisor_dict = load('sum', 'name.' + filename)
    sum_values = sum(divisor_dict.values())
    output_dict = defaultdict(lambda: defaultdict(float))
    for superkey, supervalue in input_dict.items():
        sum_supervalues = sum(supervalue.values())
        for subkey, subvalue in supervalue.items():
            output_dict[superkey][subkey] = subvalue / sum_supervalues / divisor_dict[subkey]
    dump(output_dict, 'normalized', filename)

jsonify(['namesbystate', 'namesbyterritory'])
jsonifyRace('../firstnames.Data.csv')
filenames = ['geo', 'sex', 'birth_year']
for filename in filenames:
    normalize(filename)
normalizeRace()